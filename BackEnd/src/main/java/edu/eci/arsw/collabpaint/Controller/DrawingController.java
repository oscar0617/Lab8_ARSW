package edu.eci.arsw.collabpaint.Controller;

import edu.eci.arsw.collabpaint.model.Point;
import edu.eci.arsw.collabpaint.model.Polygon;

import java.util.ArrayList;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.List;

public class DrawingController {
    private final ConcurrentHashMap<String, CopyOnWriteArrayList<Point>> drawingPoints;

    public DrawingController() {
        this.drawingPoints = new ConcurrentHashMap<>();
    }

    public synchronized void addPoint(String drawingId, Point point) {
        List<Point> points = drawingPoints.computeIfAbsent(drawingId, k -> new CopyOnWriteArrayList<>());
        points.add(point); // Agregar siempre el nuevo punto
    }

    public List<Point> getPoints(String drawingId) {
        return drawingPoints.getOrDefault(drawingId, new CopyOnWriteArrayList<>());
    }

    public boolean shouldCreatePolygon(String drawingId) {
        // Regresar true solo cuando hay 4 o más puntos
        return drawingPoints.containsKey(drawingId) &&
                drawingPoints.get(drawingId).size() >= 4;
    }

    public synchronized Polygon createPolygonFromLastFour(String drawingId) {
        List<Point> points = drawingPoints.get(drawingId);
        if (points == null || points.size() < 4) return null;

        // Tomar los últimos 4 puntos
        List<Point> lastFourPoints = points.subList(points.size() - 4, points.size());
        Polygon polygon = new Polygon(new ArrayList<>(lastFourPoints));

        // Eliminar los últimos 4 puntos de la lista
        points.subList(points.size() - 4, points.size()).clear();

        return polygon;
    }
}
