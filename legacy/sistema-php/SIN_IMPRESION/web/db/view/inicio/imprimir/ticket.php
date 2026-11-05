<?php
/*

use Mike42\Escpos\PrintConnectors\NetworkPrintConnector;
use Mike42\Escpos\Printer;
$connector = new NetworkPrintConnector("10.x.x.x", 9100);
$printer = new Printer($connector);
try {
    // ... Print stuff
} finally {
    $printer -> close();
}

*/

require __DIR__ . '/autoload.php';
use Mike42\Escpos\Printer;
use Mike42\Escpos\PrintConnectors\FilePrintConnector;
use Mike42\Escpos\PrintConnectors\WindowsPrintConnector;

	/* A wrapper to do organise item names & prices into columns */
	class item
	{
		private $name;
		private $price;
		private $dollarSign;

		public function __construct($name = '', $price = '', $dollarSign = false)
		{
			$this -> name = $name;
			$this -> price = $price;
			$this -> dollarSign = $dollarSign;
		}
		
		public function __toString()
		{
			$rightCols = 10;
			$leftCols = 38;
			if ($this -> dollarSign) {
				$leftCols = $leftCols / 2 - $rightCols / 2;
			}
			$left = str_pad($this -> name, $leftCols) ;
			
			$sign = ($this -> dollarSign ? '$ ' : '');
			$right = str_pad($sign . $this -> price, $rightCols, ' ', STR_PAD_LEFT);
			return "$left$right\n";
		}
	}
	
	$data = json_decode($_GET['matriz'],true);
	// Enter the share name for your USB printer here
// 	$connector = new WindowsPrintConnector("smb://LAPTOP-IHKV985C/".$data['nombre_imp']);

// 	$printer = new Printer($connector);

// try {
	
// 	date_default_timezone_set('America/Lima');
//     setlocale(LC_ALL,"es_ES@euro","es_ES","esp");
//     $hora = date("g:i:s A");
//   	$printer -> setJustification(Printer::JUSTIFY_CENTER);
// 	$printer -> setTextSize(2,2);
// 	if($data['cod_tped'] == 1){
// 		$printer -> text("MESA\n");
// 	}elseif($data['cod_tped'] == 2){
// 		$printer -> text("MOSTRADOR\n");
// 	}elseif($data['cod_tped'] == 3){
// 		$printer -> text("DELIVERY\n");
// 	}
// 	$printer -> feed();
// 	$printer -> selectPrintMode();
// 	if($data['cod_tped'] == 1){
// 		$printer -> text("SALON: ".$data['desc_salon']."\n");
// 		$printer -> text("MESA: ".$data['nro_pedido']."\n");
// 	}elseif($data['cod_tped'] == 2 OR $data['cod_tped'] == 3){
// 		$printer -> text("Nro de Pedido: ".$data['nro_pedido']."\n");
// 	}
// 	$printer -> feed();
// 	$printer -> setJustification(Printer::JUSTIFY_LEFT);
// 	$printer -> selectPrintMode();
// 	$printer -> text("HORA:	".$hora."\n");
// 	$printer -> text("CANT   PRODUCTO\n");
// 	foreach ($data['items'] as $value) {
// 		$printer -> text($value['cantidad']."      ".$value['producto']."\n");
// 		$printer -> text("    ".$value['comentario']."\n");
// 	}
// 	$printer -> feed();
// 	$printer -> cut();
// 	$printer -> close();

// } catch(Exception $e) {
// 	echo "No se pudo imprimir en esta impresora " . $e -> getMessage() . "\n";
// }
?>