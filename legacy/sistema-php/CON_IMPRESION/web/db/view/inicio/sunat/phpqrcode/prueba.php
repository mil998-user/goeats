<?php
require "qrlib.php";
$id=1;
$text_qr = '2660130746|03|f001|479397|18|118|26/10/2018|6|55887744|';
		$ruta_qr = "temp/".$id.".png";

		QRcode::png($text_qr, $ruta_qr, 'Q',15, 0);
 ?>


