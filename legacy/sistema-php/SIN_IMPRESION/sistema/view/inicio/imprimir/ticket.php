<?php
require_once('../../../assets/lib/pdf/cellfit.php');

class FPDF_CellFiti extends FPDF_CellFit
{
function AutoPrint($dialog=false)
{
	//Open the print dialog or start printing immediately on the standard printer
	$param=($dialog ? 'true' : 'false');
	$script="print($param);";
	$this->IncludeJS($script);
}

function AutoPrintToPrinter($server, $printer, $dialog=false)
{
	//Print on a shared printer (requires at least Acrobat 6)
	$script = "var pp = getPrintParams();";
	if($dialog)
		$script .= "pp.interactive = pp.constants.interactionLevel.full;";
	else
		$script .= "pp.interactive = pp.constants.interactionLevel.automatic;";
	$script .= "pp.printerName = '\\\\\\\\".$server."\\\\".$printer."';";
	$script .= "print(pp);";
	$this->IncludeJS($script);
}
}

$data = json_decode($_GET['matriz'],true);

date_default_timezone_set('America/Lima');
    setlocale(LC_ALL,"es_ES@euro","es_ES","esp");
     $hora = date("g:i:s A");

$pdf = new FPDF_CellFiti('P', 'mm', array(74,180));
$pdf->AddPage();
$pdf->AddFont('LucidaConsole','','lucidaconsole.php');
$pdf->SetFont('LucidaConsole','',9);
//DETALLE

$pdf->SetXY(5, 5);//modificar solo esto
$pdf->SetFont('Arial', 'B', 12);
$pdf->CellFitScale(64, 3,utf8_decode('COMANDA'), 0, 1, 'C');
$pdf->SetXY(5, 9);//modificar solo esto
$pdf->SetFont('LucidaConsole', '', 9);

if($data['cod_tped'] == 1){
 		$printer = "MESA";
 	}elseif($data['cod_tped'] == 2){
 		$printer = "MOSTRADOR";
	}elseif($data['cod_tped'] == 3){
 		$printer = "DELIVERY";
 	}


$pdf->CellFitScale(64, 3,'Sala : '.$data['desc_salon'].' - Mesa: '.utf8_decode($data['nro_pedido']), 0, 1, 'C');

$pdf->SetXY(2, 17);//modificar solo esto
$pdf->CellFitScale(15, 3,'FECHA: ', 0, 1, 'L');
$pdf->SetXY(17, 17);//modificar solo esto
$pdf->CellFitScale(55, 3,$hora, 0, 1, 'L');
$pdf->SetXY(2, 20);//modificar solo esto
$pdf->CellFitScale(70, 3,'----------------------------------------------', 0, 1, 'L');
$pdf->SetFont('LucidaConsole','',9);
$pdf->SetXY(2, 24);//modificar solo esto
$pdf->CellFitScale(20, 3,'CANT', 0, 1, 'L');
$pdf->SetXY(15, 24);//modificar solo esto
$pdf->CellFitScale(55, 3,'DESCRIPCION PRODUCTO', 0, 1, 'L');

$pdf->SetXY(2, 26);//modificar solo esto
$pdf->CellFitScale(70, 3,'----------------------------------------------', 0, 1, 'L');
$total = 0;
$y = 30;

foreach ($data['items'] as $value) {

	$pdf->SetXY(2, $y);//modificar solo esto
			$pdf->CellFitScale(10, 3,$value['cantidad'] , 0, 1, 'L');
			$pdf->SetXY(15, $y);//modificar solo esto
			$pdf->CellFitScale(60, 3,utf8_decode($value['presentacion']), 0, 1, 'L');

			$pdf->SetXY(15, $y+3);//modificar solo esto
			if($value['comentario']!=''){
				$pdf->CellFitScale(60, 3,utf8_decode($value['comentario']), 0, 1, 'L');
			}
			
			
			$y = $y + 8;

 	}

	
/*$y+...*/
	$pdf->SetXY(2, $y);//modificar solo esto
	$pdf->CellFitScale(70, 3,'----------------------------------------------', 0, 1, 'L');
	$pdf->SetXY(2, $y+8);//modificar solo esto
	$pdf->CellFitScale(55, 3,'Observaciones ', 0, 1, 'R');
	
	
$pdf->AutoPrint(true);
$pdf->Output($data['nombre_imp'].$data['nro_pedido'].'.pdf','I');
//echo "<script languaje='javascript' type='text/javascript'>window.close();</script>";
?>
