package edu.eci.arsw.collabpaint.Configuration;

import edu.eci.arsw.collabpaint.model.Point;  // Importa la clase Point
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.listener.ConnectListener;
import com.corundumstudio.socketio.listener.DataListener;
import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.AckRequest;

@Component
public class ServerCommandLineRunner implements CommandLineRunner {

    private final SocketIOServer server;

    @Autowired
    public ServerCommandLineRunner(SocketIOServer server) {
        this.server = server;
    }

    @Override
    public void run(String... args) throws Exception {
        // Iniciar el servidor Socket.IO
        server.start();
        System.out.println("Socket.IO server started on port " + server.getConfiguration().getPort());
        
        // Agregar listener para conexiones exitosas
        server.addConnectListener(new ConnectListener() {
            @Override
            public void onConnect(SocketIOClient client) {
                System.out.println("Conexión exitosa de cliente con ID: " + client.getSessionId());
            }
        });

        // Listener para recibir datos del evento 'enviar_punto' que contiene tanto X como Y
        server.addEventListener("enviar_punto", Point.class, new DataListener<Point>() {
            @Override
            public void onData(SocketIOClient client, Point data, AckRequest ackRequest) {
                System.out.println("Punto recibido del cliente " + client.getSessionId() + ": X=" + data.getX() + ", Y=" + data.getY());
                server.getBroadcastOperations().sendEvent("nuevo_punto", data);
                if (ackRequest.isAckRequested()) {
                    ackRequest.sendAckData("Punto recibido");
                }
            }
        });

        // Registrar un shutdown hook para detener el servidor correctamente
        Runtime.getRuntime().addShutdownHook(new Thread(() -> {
            System.out.println("Stopping Socket.IO server...");
            server.stop();
        }));
    }
}
