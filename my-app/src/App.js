import React, { useState, useEffect, useRef } from "react";
import io from 'socket.io-client';
import './styles/socketsCommunication.css';

function App() {
  const [socket, setSocket] = useState(null); // Estado para almacenar el socket
  const [isConnected, setIsConnected] = useState(false);
  const [x, setX] = useState('');  // Estado para el valor de X
  const [y, setY] = useState('');  // Estado para el valor de Y
  const [drawnPoints, setDrawnPoints] = useState([]); // Puntos acumulados en el canvas
  const userCanvasRef = useRef(null); // Canvas

  
  useEffect(() => {
    if (socket) {
      socket.on('connect', () => {
        console.log("Conectado al servidor");
        setIsConnected(true);
      });

      socket.on('nuevo_punto', (data) => {
        console.log("Punto replicado recibido: ", data);
        setDrawnPoints((prevPoints) => {
          const updatedPoints = [...prevPoints, data];
          drawUserPoints(updatedPoints, userCanvasRef);
          return updatedPoints;
        });
      });

      return () => {
        socket.off('connect');
        socket.off('nuevo_punto');
      };
    }
  }, [socket]);

  const enviarXY = () => {
    const punto = { x: parseInt(x), y: parseInt(y) }; 
    if (x !== '' && y !== '' && socket) {
      socket.emit('enviar_punto', punto);  
      console.log(`Punto enviado: X=${x}, Y=${y}`);
    }
  };
  
  const drawUserPoints = (points, canvasRef) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.lineJoin = "round";
    context.lineWidth = 2;
    context.strokeStyle = "blue";
    context.beginPath();
    points.forEach((point, index) => {
      if (index === 0) {
        context.moveTo(point.x, point.y); 
      } else {
        context.lineTo(point.x, point.y); 
      }
    });
    context.stroke();
  };

  const handleUserCanvasClick = (e) => {
    const canvas = userCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newPoint = { x, y };
    if (socket) {
      socket.emit('enviar_punto', newPoint); 
      console.log(`Punto enviado: X=${x}, Y=${y}`);
    }
    setDrawnPoints((prevPoints) => {
      const updatedPoints = [...prevPoints, newPoint];
      drawUserPoints(updatedPoints, userCanvasRef); 
      return updatedPoints;
    });
  };

  // Función para conectarse a la sala
  const conectarseSala = () => {
    const numeroSala = prompt("Ingrese el número de sala:");
    if (numeroSala) {
      const newSocket = io('http://127.0.0.1:8085', {
        transports: ['websocket'],
        query: { room: `sala_${numeroSala}` }
      });
      setSocket(newSocket);

    }
  };

  const limpiarCanvas = () => {
    const canvas = userCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  const limpiarPuntos = () => {
    setDrawnPoints([]);
  }

  const limpiarYConectarse = () => {
    limpiarCanvas();
    limpiarPuntos();
    conectarseSala();
  }

  

  return (
    <div className="App">
      <button onClick={limpiarYConectarse}>Conectarse a la Sala</button>
      <h2>{isConnected ? 'Conectado' : 'No conectado'}</h2>
      <div className="inputs"> 
        X: <input 
              id="x" 
              type="number" 
              value={x} 
              onChange={e => setX(e.target.value)} 
            />
        Y: <input 
              id="y" 
              type="number" 
              value={y} 
              onChange={e => setY(e.target.value)} 
            />
        <button onClick={enviarXY}>Send point</button>
      </div>

      {/* Canvas interactivo del usuario para colocar puntos */}
      <div className="canvas-container">
        <h3>Canvas</h3>
        <canvas
          ref={userCanvasRef}
          width="400"
          height="400"
          className="styled-canvas"    
          onClick={handleUserCanvasClick}
        ></canvas>
      </div>
    </div>
  );
}

export default App;
