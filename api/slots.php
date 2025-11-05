<?php
const ADMIN_KEY = 'CAMBIA_ESTA_CLAVE';
$sLOTS_FILE = __DIR__ . '/../assets/slots.json';
header('Content-Type: application/json; charset=utf-8');
function read_slots($file){ if(!file_exists($file)) return []; $json=file_get_contents($file); $d=json_decode($json,true); return is_array($d)?$d:[]; }
function write_slots($file,$data){ $fp=fopen($file,'c+'); if(!$fp) return false; flock($fp,LOCK_EX); ftruncate($fp,0); $ok=fwrite($fp,json_encode($data,JSON_UNESCAPED_UNICODE|JSON_PRETTY_PRINT)); fflush($fp); flock($fp,LOCK_UN); fclose($fp); return $ok!==false; }
function require_admin(){ $key=$_SERVER['HTTP_X_ADMIN_KEY'] ?? ($_POST['adminKey'] ?? $_GET['adminKey'] ?? ''); if($key!==ADMIN_KEY){ http_response_code(401); echo json_encode(['error'=>'No autorizado']); exit; } }
function valid_date($d){ return preg_match('/^\d{4}-\d{2}-\d{2}$/',$d); }
function valid_time($t){ return preg_match('/^\d{2}:\d{2}$/',$t); }
$action=$_GET['action'] ?? 'list';
if($action==='list'){ echo json_encode(['slots'=>read_slots($sLOTS_FILE)],JSON_UNESCAPED_UNICODE); exit; }
if($action==='add'){ require_admin(); $date=$_POST['date']??''; $time=$_POST['time']??''; if(!valid_date($date)||!valid_time($time)){ http_response_code(400); echo json_encode(['error'=>'Formato inválido']); exit; } $slots=read_slots($sLOTS_FILE); if(!isset($slots[$date])) $slots[$date]=[]; if(!in_array($time,$slots[$date],true)){$slots[$date][]=$time; sort($slots[$date]);} ksort($slots); if(!write_slots($sLOTS_FILE,$slots)){ http_response_code(500); echo json_encode(['error'=>'No se pudo guardar']); exit; } echo json_encode(['ok'=>true,'slots'=>$slots],JSON_UNESCAPED_UNICODE); exit; }
if($action==='remove'){ require_admin(); $date=$_POST['date']??''; $time=$_POST['time']??''; if(!valid_date($date)||!valid_time($time)){ http_response_code(400); echo json_encode(['error'=>'Formato inválido']); exit; } $slots=read_slots($sLOTS_FILE); if(isset($slots[$date])){ $slots[$date]=array_values(array_filter($slots[$date],fn($t)=>$t!==$time)); if(empty($slots[$date])) unset($slots[$date]); } ksort($slots); if(!write_slots($sLOTS_FILE,$slots)){ http_response_code(500); echo json_encode(['error'=>'No se pudo guardar']); exit; } echo json_encode(['ok'=>true,'slots'=>$slots],JSON_UNESCAPED_UNICODE); exit; }
http_response_code(400); echo json_encode(['error'=>'Acción no válida']);
