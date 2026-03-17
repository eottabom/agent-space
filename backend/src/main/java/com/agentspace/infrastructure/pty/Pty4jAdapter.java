package com.agentspace.infrastructure.pty;

import com.agentspace.domain.service.PtyService;
import com.pty4j.PtyProcess;
import com.pty4j.PtyProcessBuilder;
import com.pty4j.WinSize;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.LinkedBlockingDeque;
import java.util.function.Consumer;

@Component
public class Pty4jAdapter implements PtyService {

    private static final Logger log = LoggerFactory.getLogger(Pty4jAdapter.class);
    private static final int HISTORY_MAX_CHUNKS = 4096;
    private static final int READ_BUFFER_SIZE = 8192;

    private final ConcurrentHashMap<String, PtyHandle> handles = new ConcurrentHashMap<>();

    @Override
    public void create(String sessionId, String[] command, String cwd) throws IOException {
        Map<String, String> env = new HashMap<>(System.getenv());
        env.put("TERM", "xterm-256color");
        env.put("COLORTERM", "truecolor");
        env.put("CLICOLOR", "1");

        // bash는 기본 PS1에 색상이 없어 프롬프트와 출력을 구분하기 어렵다
        if (command[0].endsWith("bash")) {
            env.put("PROMPT_COMMAND",
                    "PS1='\\[\\e[1;32m\\]\\u\\[\\e[0m\\]:\\[\\e[1;36m\\]\\w\\[\\e[0m\\]\\$ '");
        }

        PtyProcessBuilder builder = new PtyProcessBuilder(command)
                .setDirectory(cwd)
                .setEnvironment(env)
                .setInitialColumns(120)
                .setInitialRows(40)
                .setRedirectErrorStream(true);

        PtyProcess process = builder.start();
        PtyHandle handle = new PtyHandle(sessionId, process);
        handles.put(sessionId, handle);
        handle.startReader();

        log.info("PTY created: {} cmd={}", sessionId, Arrays.toString(command));
    }

    @Override
    public void write(String sessionId, byte[] data) throws IOException {
        PtyHandle handle = handles.get(sessionId);
        if (handle != null && handle.isAlive()) {
            synchronized (handle.outputStream) {
                handle.outputStream.write(data);
                handle.outputStream.flush();
            }
        }
    }

    @Override
    public void resize(String sessionId, int cols, int rows) {
        PtyHandle handle = handles.get(sessionId);
        if (handle != null && handle.isAlive()) {
            handle.process.setWinSize(new WinSize(cols, rows));
        }
    }

    @Override
    public void kill(String sessionId) {
        PtyHandle handle = handles.remove(sessionId);
        if (handle != null) {
            handle.running = false;
            handle.process.destroy();
            if (handle.process.isAlive()) {
                handle.process.destroyForcibly();
            }
            if (handle.readerThread != null) {
                handle.readerThread.interrupt();
            }
            log.info("PTY killed: {}", sessionId);
        }
    }

    @Override
    public boolean isAlive(String sessionId) {
        PtyHandle handle = handles.get(sessionId);
        return handle != null && handle.isAlive();
    }

    @Override
    public byte[] getHistory(String sessionId) {
        PtyHandle handle = handles.get(sessionId);
        if (handle == null) {
            return new byte[0];
        }

        byte[][] chunks = handle.history.toArray(new byte[0][]);
        int total = 0;
        for (byte[] chunk : chunks) {
            total += chunk.length;
        }

        byte[] result = new byte[total];
        int offset = 0;
        for (byte[] chunk : chunks) {
            System.arraycopy(chunk, 0, result, offset, chunk.length);
            offset += chunk.length;
        }
        return result;
    }

    @Override
    public void addOutputListener(String sessionId, Consumer<byte[]> listener) {
        PtyHandle handle = handles.get(sessionId);
        if (handle != null) {
            handle.listeners.add(listener);
        }
    }

    @Override
    public void removeOutputListener(String sessionId, Consumer<byte[]> listener) {
        PtyHandle handle = handles.get(sessionId);
        if (handle != null) {
            handle.listeners.remove(listener);
        }
    }

    private static class PtyHandle {

        final String sessionId;
        final PtyProcess process;
        final OutputStream outputStream;
        final LinkedBlockingDeque<byte[]> history = new LinkedBlockingDeque<>(HISTORY_MAX_CHUNKS);
        final CopyOnWriteArrayList<Consumer<byte[]>> listeners = new CopyOnWriteArrayList<>();
        volatile boolean running = true;
        Thread readerThread;

        PtyHandle(String sessionId, PtyProcess process) {
            this.sessionId = sessionId;
            this.process = process;
            this.outputStream = process.getOutputStream();
        }

        boolean isAlive() {
            return running && process.isAlive();
        }

        void startReader() {
            readerThread = Thread.ofVirtual().name("pty-reader-" + sessionId).start(() -> {
                try {
                    InputStream inputStream = process.getInputStream();
                    byte[] buffer = new byte[READ_BUFFER_SIZE];
                    while (running && process.isAlive()) {
                        int byteCount = inputStream.read(buffer);
                        if (byteCount <= 0) {
                            if (byteCount < 0) {
                                break;
                            }
                            continue;
                        }

                        byte[] chunk = Arrays.copyOf(buffer, byteCount);
                        while (!history.offerLast(chunk)) {
                            history.pollFirst();
                        }

                        for (Consumer<byte[]> listener : listeners) {
                            try {
                                listener.accept(chunk);
                            } catch (Exception ex) {
                                log.warn("Listener error: {}", ex.getMessage());
                            }
                        }
                    }
                } catch (IOException ex) {
                    if (running) {
                        log.error("PTY read error {}: {}", sessionId, ex.getMessage());
                    }
                } finally {
                    running = false;
                }
            });
        }
    }
}
