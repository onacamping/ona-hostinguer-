<?php
session_save_path(__DIR__ . "/../sessions");
if (!is_dir(session_save_path())) mkdir(session_save_path(), 0777, true);
session_start();


if (!isset($_SESSION['rol']) || ($_SESSION['rol'] !== 'admin' && $_SESSION['rol'] !== 'superadmin')) {
    // Para depuración temporal: si no hay sesión, pero estamos en desarrollo
    // $_SESSION['rol'] = 'admin'; 
    header('Content-Type: application/json');
    http_response_code(403);
    echo json_encode(['error' => 'Acceso denegado: Se requiere rol de administrador']);
    exit;
}
?>