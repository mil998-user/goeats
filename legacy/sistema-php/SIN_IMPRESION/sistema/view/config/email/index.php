<?php
session_start();
require_once ("../../../model/db.php"); // Contiene las variables de configuracion para conectar a la base de datos
require_once ("../../../model/conexion.php");
$id_venta = intval($_GET['id_venta']);

$datosEmpresa = $_SESSION["datosempresa"];
foreach ($datosEmpresa as $reg) {
    $fac_ele = $reg['fac_ele'];
    $clave = $reg['clave'];
    $nombre_empresa = $reg['raz_soc'];
    $departamento = "Lima";
    $provincia = "Lima";
    $distrito = "Lima";
    $ruc1 = $reg['ruc'];
    $direccion = $reg['direccion'];
}
$nombre_empresa = str_replace("&amp;", "&", $nombre_empresa);

?>
<!DOCTYPE HTML>
<html>
<head>
<title>Enviar correo.</title>
<!-- Custom Theme files -->
<link href="css/style.css" rel="stylesheet" type="text/css" media="all" />
<!-- Custom Theme files -->
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="viewport"
	content="width=device-width, initial-scale=1, maximum-scale=1">
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<meta name="keywords" content="" />
<!--Google Fonts-->
<link
	href='http://fonts.googleapis.com/css?family=Roboto+Condensed:400italic,700italic,400,300,700'
	rel='stylesheet' type='text/css'>
<!--Google Fonts-->
<script src="./js/jquery.min.js"></script>

</head>
<body>
	<!--coact start here-->
	<h1>Formulario de envio Documentos Electr&oacute;nicos.</h1>
	<div class="contact">
		<div class="contact-main">
			<form method="post">
				<h3>Correo a enviar:</h3>
				<input type="email" placeholder="Correo electr&oacute;nico"
					class="hola" name="customer_email" required />
            		<?php
            if (isset($_POST['send'])) {
                include ("sendemail.php"); // Mando a llamar la funcion que se encarga de enviar el correo electronico

                /* Configuracion de variables para enviar el correo */
                $mail_addAddress = $_POST['customer_email']; // correo electronico que recibira el mensaje
                $template = "email_template.html"; // Ruta de la plantilla HTML para enviar nuestro mensaje

                /* Inicio captura de datos enviados por $_POST para enviar el correo */
                ob_start(); // start capturing output
                include ('ver_ticket.php'); // execute the file
                $content = ob_get_contents(); // get the contents from the buffer
                ob_end_clean();

                $mail_subject = "Envio de Documentos Electronicos";
                $imagen = "../../inicio/sunat/qr/" . $id_venta . ".png";
                sendemail($imagen, $nombre_empresa, $mail_addAddress, $content, $mail_subject, $template, true); // Enviar el mensaje
            }

            ?>		
				<div class="enviar">
					<div class="contact-enviar">
						<input type="submit" value="Enviar Documento" name="send">
					</div>
					<div class="clear"></div>
				</div>
			</form>
		</div>
	</div>

	<!--contact end here-->
</body>
</html>