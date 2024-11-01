import React, { useState, useEffect, useRef } from "react";
import io from 'socket.io-client';
import './styles/socketsCommunication.css';

function App() {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [x, setX] = useState('');
  const [y, setY] = useState('');
  const [drawnPoints, setDrawnPoints] = useState([]);
  const [polygons, setPolygons] = useState([]);

  const userCanvasRef = useRef(null);

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
          drawUserPoints(updatedPoints);
          return updatedPoints; 
        });
      });

      socket.on('polygon', (polygon) => {
        console.log("Polígono recibido: ", polygon);
        if (polygon && Array.isArray(polygon.points)) {
          setPolygons(prevPolygons => {
            const updatedPolygons = [...prevPolygons, polygon];
            drawPolygons(userCanvasRef.current, updatedPolygons); // Pass the updated polygons array
            return updatedPolygons;
          });
        } else {
          console.error("El polígono recibido no tiene una estructura válida");
        }
      });
      

      return () => {
        socket.off('connect');
        socket.off('nuevo_punto');
        socket.off('polygon');
      };
    }
  }, [socket]);

  const getRandomColor = () => {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  };

  const drawPolygons = (canvas, polygons) => {
    const context = canvas.getContext("2d");
    
    // Dibuja cada polígono que tengas almacenado
    polygons.forEach(polygon => {
      context.beginPath();
      context.moveTo(polygon.points[0].x, polygon.points[0].y);
      polygon.points.forEach((point) => {
        context.lineTo(point.x, point.y);
      });
      context.closePath();
      context.fillStyle = polygon.color + '80'; // Color de fondo con opacidad
      context.fill();
      context.strokeStyle = polygon.color; // Usar el color del polígono
      context.lineWidth = 2;
      context.stroke();
    });
  };
  

  const enviarXY = () => {
    if (x !== '' && y !== '' && socket) {
      const punto = { 
        x: parseInt(x), 
        y: parseInt(y)
      };
      socket.emit('enviar_punto', punto, (response) => {
        console.log('Respuesta del servidor:', response);
      });
      console.log(`Punto enviado: X=${x}, Y=${y}`);
    }
  };

  const drawUserPoints = (points) => {
    const canvas = userCanvasRef.current;
    const context = canvas.getContext("2d");
    
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Dibuja los polígonos antes de dibujar los puntos
    drawPolygons(canvas, polygons);

    if (points.length > 0) {
      context.beginPath();
      context.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        context.lineTo(points[i].x, points[i].y);
      }
      if (points.length >= 4) {
        context.lineTo(points[0].x, points[0].y); 
      }
      context.strokeStyle = "#808080"; 
      context.lineWidth = 1;
      context.stroke();

      points.forEach((point) => {
        context.beginPath();
        context.arc(point.x, point.y, 4, 0, 2 * Math.PI);
        context.fillStyle = "blue"; 
        context.fill();
        context.strokeStyle = "white";
        context.lineWidth = 1;
        context.stroke();
      });
    }
  };

  const handleUserCanvasClick = (e) => {
    if (!socket) return;

    const canvas = userCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const punto = {
      x: Math.round(e.clientX - rect.left),
      y: Math.round(e.clientY - rect.top)
    };
    
    setDrawnPoints(prevPoints => {
      const newPoints = [...prevPoints, punto];
      drawUserPoints(newPoints);
      return newPoints;
    });
    
    socket.emit('enviar_punto', punto, (response) => {
      console.log('Punto enviado y confirmado:', response);
    });
  };

  const conectarseSala = () => {
    const numeroSala = prompt("Ingrese el número de sala:");
    if (numeroSala) {
      if (socket) {
        socket.disconnect();
      }
      
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
    setDrawnPoints([]);
    setPolygons([]);
  };

  const limpiarYConectarse = () => {
    limpiarCanvas();
    conectarseSala();
  };

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
        <button onClick={() => enviarXY()}>Enviar punto</button>
      </div>

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
