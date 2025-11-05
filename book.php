<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$sLOTS_FILE = __DIR__ . '/assets/slots.json';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405); echo json_encode(['error'=>'Método no permitido']); exit;
}

$nombre   = trim($_POST['nombre'] ?? '');
$telefono = trim($_POST['telefono'] ?? '');
$servicio = trim($_POST['servicio'] ?? '');
$fecha    = trim($_POST['fecha'] ?? '');
$hora     = trim($_POST['hora'] ?? '');

if(!$nombre || !$telefono || !$servicio || !$fecha || !$hora){
  http_response_code(400); echo json_encode(['error'=>'Campos faltantes']); exit;
}

$APPS_SCRIPT_URL = getenv('APPS_SCRIPT_URL') ?: '';
if(!$APPS_SCRIPT_URL){
  http_response_code(500); echo json_encode(['error'=>'Falta APPS_SCRIPT_URL']); exit;
}

$payload = [
  'nombre'=>$nombre,'telefono'=>$telefono,'servicio'=>$servicio,'fecha'=>$fecha,'hora'=>$hora,
];
$ch = curl_init($APPS_SCRIPT_URL);
curl_setopt_array($ch, [
  CURLOPT_POST=>true,
  CURLOPT_RETURNTRANSFER=>true,
  CURLOPT_HTTPHEADER=>['Content-Type: application/json'],
  CURLOPT_POSTFIELDS=>json_encode($payload, JSON_UNESCAPED_UNICODE),
  CURLOPT_TIMEOUT=>10,
]);
$resp = curl_exec($ch);
$err  = curl_error($ch);
$code = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
curl_close($ch);

if($err || $code>=400){
  http_response_code(502); echo json_encode(['error'=>'No se pudo crear la cita (Apps Script).']); exit;
}

function read_slots($file){ if(!file_exists($file)) return []; $json=file_get_contents($file); $d=json_decode($json,true); return is_array($d)?$d:[]; }
function write_slots($file,$data){ $fp=fopen($file,'c+'); if(!$fp) return false; flock($fp,LOCK_EX); ftruncate($fp,0); $ok=fwrite($fp,json_encode($data,JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT)); fflush($fp); flock($fp,LOCK_UN); fclose($fp); return $ok!==false; }

$slots = read_slots($sLOTS_FILE);
if(isset($slots[$fecha])){
  $slots[$fecha] = array_values(array_filter($slots[$fecha], fn($t) => $t !== $hora));
  if(empty($slots[$fecha])) unset($slots[$fecha]);
  write_slots($sLOTS_FILE, $slots);
}

echo $resp;
