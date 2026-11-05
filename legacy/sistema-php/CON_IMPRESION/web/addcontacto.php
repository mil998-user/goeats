<?php
session_start(); 
$session_id= session_id(); 


$para  = "rinconsuizo0744@gmail.com";
$titulo = 'MENSAJE DESDE CONTACTOS';
ob_start();
include "mail/contacto.php";
$mensaje = ob_get_contents();
ob_end_clean();
$cabeceras  = 'MIME-Version: 1.0' . "\r\n";
$cabeceras .= 'Content-type: text/html; charset=iso-8859-1' . "\r\n";   
$cabeceras .= 'From: MENSAJE DE CONTACTOS <rinconsuizo0744@gmail.com>' . "\r\n";    
mail($para, $titulo, $mensaje, $cabeceras);
print "<script>window.location='contacto.php';</script>";
?>
			
           