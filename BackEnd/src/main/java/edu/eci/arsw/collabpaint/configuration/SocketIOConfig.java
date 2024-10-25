package edu.eci.arsw.collabpaint.Configuration;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import com.corundumstudio.socketio.SocketIOServer;

@Configuration
public class SocketIOConfig {

    @Value("${socket-server.host}")
    private String host;

    @Value("${socket-server.port}")
    private Integer port;

    @Value("${socket-server.origin}")
    private String origin;

    @Bean
    public SocketIOServer socketIOServer() {
        com.corundumstudio.socketio.Configuration config = new com.corundumstudio.socketio.Configuration();
        config.setHostname(host); 
        config.setPort(port); 

        config.setOrigin("http://localhost:3000");

        return new SocketIOServer(config);
    }

}
