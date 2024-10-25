import React, { useState, useEffect } from "react";
import io from 'socket.io-client';
import './styles/socketsCommunication.css';

const socket = io('http://127.0.0.1:8085', {
  transports: ['websocket']
});


function App() {
  const [isConnected, setIsConnected] = useState(false);
  const [x, setX] = useState('');  // Estado para el valor de X
  const [y, setY] = useState('');  // Estado para el valor de Y
  const [puntosRecibidos, setPuntosRecibidos] = useState([]); // Para recibir puntos

  useEffect(() => {
    socket.on('connect', () => {
      console.log("Conectado al servidor");
      setIsConnected(true);
    });

    // Escuchar el evento 'nuevo_punto' que contiene los puntos replicados
    socket.on('nuevo_punto', (data) => {
      console.log("Punto replicado recibido: ", data);
      setPuntosRecibidos(prevPuntos => [...prevPuntos, data]);  // Agrega el punto recibido a la lista
    });

    return () => {
      socket.off('connect');
      socket.off('nuevo_punto');
    };
  }, []);

  const enviarXY = () => {
    const punto = { x: parseInt(x), y: parseInt(y) };  // Crea un objeto con X e Y
    if (x !== '' && y !== '') {
      socket.emit('enviar_punto', punto);  // Envía el objeto 'punto' al servidor
      console.log(`Punto enviado: X=${x}, Y=${y}`);
    }
  };

  return (
    <div className="App">
      <h2>{isConnected ? 'Conectado' : 'No conectado'}</h2>

      <div className="inputs"> 
        X: <input 
              id="x" 
              type="number" 
              value={x} 
              onChange={e => setX(e.target.value)}  // Actualiza el estado de X
            />
        Y: <input 
              id="y" 
              type="number" 
              value={y} 
              onChange={e => setY(e.target.value)}  // Actualiza el estado de Y
            />
        <button onClick={enviarXY}>Send point</button>
      </div>
      
      {/* Mostrar puntos replicados */}
      <div>
        <h3>Puntos recibidos:</h3>
        <ul>
          {puntosRecibidos.map((punto, index) => (
            <li key={index}>X={punto.x}, Y={punto.y}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;