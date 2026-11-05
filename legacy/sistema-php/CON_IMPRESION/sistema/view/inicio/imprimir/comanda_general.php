<?php
require_once 'view/inicio/imprimir/num_letras.php';
require_once('assets/lib/pdf/cellfit.php');

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

$pdf = new FPDF_CellFiti('P', 'mm', array(74,180));
$pdf->AddPage();
$pdf->AddFont('LucidaConsole','','lucidaconsole.php');
$pdf->SetFont('LucidaConsole','',9);
//DETALLE

$pdf->SetXY(5, 5);//modificar solo esto
$pdf->CellFitScale(64, 3,utf8_decode('COMANDA'), 0, 1, 'C');
$pdf->SetXY(5, 9);//modificar solo esto
$pdf->CellFitScale(64, 3,'Sala : '.utf8_decode($data->desc_m).' - Mesa: '.utf8_decode($data->nro_mesa), 0, 1, 'C');

$pdf->SetXY(2, 17);//modificar solo esto
$pdf->CellFitScale(15, 3,'FECHA: ', 0, 1, 'L');
$pdf->SetXY(17, 17);//modificar solo esto
$pdf->CellFitScale(55, 3,date('d-m-Y h:i A',strtotime($data->fecha_p)), 0, 1, 'L');
$pdf->SetXY(2, 20);//modificar solo esto
$pdf->CellFitScale(70, 3,'----------------------------------------------', 0, 1, 'L');
$pdf->SetFont('LucidaConsole','',9);
$pdf->SetXY(2, 24);//modificar solo esto
$pdf->CellFitScale(60, 3,'PRODUCTO', 0, 1, 'L');
$pdf->SetXY(62, 24);//modificar solo esto
$pdf->CellFitScale(8, 3,'CANT', 0, 1, 'L');

$pdf->SetXY(2, 26);//modificar solo esto
$pdf->CellFitScale(70, 3,'----------------------------------------------', 0, 1, 'L');
$total = 0;
$y = 30;
	foreach($data->Detalle as $d){
		if($d->cantidad > 0){
			$pdf->SetXY(2, $y);//modificar solo esto
			$pdf->CellFitScale(60, 3,utf8_decode($d->Producto->nombre_prod).' '.utf8_decode($d->Producto->pres_prod), 0, 1, 'L');
			$pdf->SetXY(62, $y);//modificar solo esto
			$pdf->CellFitScale(8, 3,$d->cantidad, 0, 1, 'L');
			
			
			$y = $y + 3;
			
		}
	}
/*$y+...*/
	$pdf->SetXY(2, $y);//modificar solo esto
	$pdf->CellFitScale(70, 3,'----------------------------------------------', 0, 1, 'L');
	
$pdf->AutoPrint(false);
$pdf->Output();
//echo "<script languaje='javascript' type='text/javascript'>window.close();</script>";
?>
