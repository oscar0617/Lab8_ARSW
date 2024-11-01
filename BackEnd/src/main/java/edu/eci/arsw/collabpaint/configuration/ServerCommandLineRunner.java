package edu.eci.arsw.collabpaint.configuration;

import edu.eci.arsw.collabpaint.model.Point;
import edu.eci.arsw.collabpaint.model.Polygon;
import edu.eci.arsw.collabpaint.Controller.DrawingController;
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
    private final DrawingController drawingController;

    @Autowired
    public ServerCommandLineRunner(SocketIOServer server) {
        this.server = server;
        this.drawingController = new DrawingController();
    }

    @Override
    public void run(String... args) throws Exception {
        server.start();
        System.out.println("Socket.IO server iniciado en el puerto " + server.getConfiguration().getPort());

        // Listener para conexiones
        server.addConnectListener(new ConnectListener() {
            @Override
            public void onConnect(SocketIOClient client) {
                String room = client.getHandshakeData().getSingleUrlParam("room");
                System.out.println("Cliente conectado - ID: " + client.getSessionId());
                System.out.println("Sala: " + room);
                client.joinRoom(room);
            }
        });

        // Listener para puntos
        server.addEventListener("enviar_punto", Point.class, new DataListener<Point>() {
            @Override
            public void onData(SocketIOClient client, Point point, AckRequest ackRequest) {
                String room = client.getHandshakeData().getSingleUrlParam("room");

                // Agregar el punto al controlador
                drawingController.addPoint(room, point);

                // Propagar el punto a todos los clientes en la sala
                server.getRoomOperations(room).sendEvent("nuevo_punto", point);

                // Verificar si debemos crear un polígono después de recibir 4 o más puntos
                if (drawingController.shouldCreatePolygon(room)) {
                    Polygon polygon = drawingController.createPolygonFromLastFour(room);
                    if (polygon != null) {
                        // Enviar el polígono a todos los clientes en la sala
                        server.getRoomOperations(room).sendEvent("polygon", polygon);
                    }
                }

                // Enviar confirmación al cliente
                if (ackRequest.isAckRequested()) {
                    ackRequest.sendAckData("Punto recibido en sala " + room);
                }
            }
        });
    }
}