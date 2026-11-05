<?php
require_once 'view/inicio/imprimir/num_letras.php';
require_once('assets/lib/pdf/cellfit.php');
$de = $_SESSION["datosempresa"];
$texto = 'Guarda tu voucher. Es el sustento para validar tu compra. No se aceptan devoluciones de dinero.';

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

$pdf = new FPDF_CellFiti('P', 'mm', array(74,350));
$pdf->AddPage();
$pdf->SetMargins(-20,-20,-20);
//$pdf->AddFont('LucidaConsole','','lucidaconsole.php');
$pdf->SetFont('Arial','',8);
//DETALLE DE LA EMPRESA
$h = 5;
foreach($de as $reg) {
	$pdf->SetXY(1, $h);//modificar solo esto
	//$pdf->Image('leon.jpg' , 80 ,22, 35 , 38,'JPG', 'http://www.desarrolloweb.com');
	$pdf->CellFitScale(64, 3,utf8_decode($reg['razon_social']), 0, 1, 'C');
	$pdf->SetXY(5, $h+3);//modificar solo esto
	$pdf->CellFitScale(64, 3,'RUC : '.utf8_decode($reg['ruc']), 0, 1, 'C');
	$pdf->SetXY(5, $h+6);//modificar solo esto
	$pdf->CellFitScale(64, 3,'Dir: '.utf8_decode($reg['direccion']), 0, 1, 'C');
	$pdf->SetXY(5, $h+9);//modificar solo esto
	$pdf->CellFitScale(64, 3,'Telf: '.utf8_decode($reg['telefono']), 0, 1, 'C');
	$pdf->SetFont('Arial','',12);
	$pdf->SetXY(5, $h+14);//modificar solo esto
	$pdf->CellFitScale(64, 3,utf8_decode($data->desc_td).' DE VENTA', 0, 1, 'C');
	$pdf->SetXY(5, $h+19);//modificar solo esto
	$pdf->CellFitScale(64, 3,utf8_decode($data->ser_doc).'-'.utf8_decode($data->nro_doc), 0, 1, 'C');
	$pdf->SetFont('Arial','',9);
	$pdf->SetXY(2, $h+24);//modificar solo esto
	$pdf->CellFitScale(70, 3,'FECHA DE EMISION: '.date('d-m-Y h:i A',strtotime($data->fec_ven)), 0, 1, 'L');
	$pdf->SetXY(2, $h+26);//modificar solo esto
	$pdf->CellFitScale(70, 3,'----------------------------------------------', 0, 1, 'L');

	$pdf->SetFont('Arial','',6);
	$pdf->SetXY(2, $h+28);//modificar solo esto
	$pdf->CellFitScale(15, 3,'CLIENTE: ', 0, 1, 'L');
	$pdf->SetXY(17, $h+28);//modificar solo esto
	$pdf->CellFitScale(55, 3,utf8_decode($data->Cliente->nombre), 0, 1, 'L');
	$pdf->SetXY(2, $h+31);//modificar solo esto
	$pdf->CellFitScale(15, 3,'DNI/RUC: ', 0, 1, 'L');
	$pdf->SetXY(17, $h+31);//modificar solo esto
	$pdf->CellFitScale(55, 3,utf8_decode($data->Cliente->dni.''.$data->Cliente->ruc), 0, 1, 'L');
	$pdf->SetXY(2, $h+34);//modificar solo esto
	$pdf->CellFitScale(15, 3,'DIRECCION: ', 0, 1, 'L');
	$pdf->SetXY(17, $h+34);//modificar solo esto
	$pdf->CellFitScale(55, 3,utf8_decode($data->Cliente->direccion), 0, 1, 'L');

	$pdf->SetFont('Arial','',8);
	$pdf->SetXY(0, $h+36);//modificar solo esto
	$pdf->CellFitScale(70, 3,'----------------------------------------------', 0, 1, 'L');
  $pdf->SetXY(0, $h+39);//modificar solo esto
	$pdf->CellFitScale(28, 3,'PRODUCTO', 0, 1, 'L');
	$pdf->SetXY(42, $h+39);//modificar solo esto
	$pdf->CellFitScale(6, 3,'CANT', 0, 1, 'R');
	$pdf->SetXY(50, $h+39);//modificar solo esto
	$pdf->CellFitScale(8, 3,'P.UN.', 0, 1, 'R');
	$pdf->SetXY(61, $h+39);//modificar solo esto
	$pdf->CellFitScale(8, 3,'IMP.', 0, 1, 'R');
	$pdf->SetXY(0, $h+41);//modificar solo esto
	$pdf->CellFitScale(70, 3,'-------------------------------------------------------------------', 0, 1, 'L');
	$y = 44;
	$pdf->SetFont('Arial','',7);
	foreach($data->Detalle as $d){
		$pdf->SetXY(0, $h+$y);//modificar solo esto
		$pdf->CellFitScale(32, 3,utf8_decode($d->Producto->nombre_prod).' '.utf8_decode($d->Producto->pres_prod), 0, 1, 'L');
		$pdf->SetXY(32, $h+$y);//modificar solo esto
		$pdf->CellFitScale(4, 3,$d->cantidad, 0, 1, 'R');
		$pdf->SetXY(36, $h+$y);//modificar solo esto
		$pdf->CellFitScale(7, 3,$d->precio, 0, 1, 'R');
		$pdf->SetXY(43, $h+$y);//modificar solo esto
		$pdf->CellFitScale(7, 3,number_format(($d->cantidad * $d->precio),2), 0, 1, 'R');
		$y = $y + 3;
	}
	/*$y+...*/
	$pdf->SetFont('Arial','',8);
	$pdf->SetXY(2, $h+$y);//modificar solo esto
	$pdf->CellFitScale(70, 3,'----------------------------------------------', 0, 1, 'L');
	$pdf->SetXY(2, $h+$y+3);//modificar solo esto
	$pdf->CellFitScale(55, 3,'Importe Total: '.$_SESSION["moneda"], 0, 1, 'R');
	$pdf->SetXY(57, $h+$y+3);//modificar solo esto
	$pdf->CellFitScale(15, 3,number_format(($data->total),2), 0, 1, 'R');
	$pdf->SetXY(2, $h+$y+6);//modificar solo esto
	$pdf->CellFitScale(70, 3,'----------------------------------------------', 0, 1, 'L');
	$z = 3;
	/*$y+6+$z...*/

	$sbt = ($data->total / (1 + $data->igv));
	$igv = (($sbt - $data->descu) * $data->igv);

	if($data->id_tdoc == 1){
		$pdf->SetXY(2, $h+$y+6+$z);//modificar solo esto
		$pdf->CellFitScale(55, 3,'Dscto: '.$_SESSION["moneda"], 0, 1, 'R');
		$pdf->SetXY(57, $h+$y+6+$z);//modificar solo esto
		$pdf->CellFitScale(15, 3,'-'.number_format(($data->descu),2), 0, 1, 'R');
		$a = 3;
	}else{
		$pdf->SetXY(2, $h+$y+6+$z);//modificar solo esto
		$pdf->CellFitScale(55, 3,'SubTotal: '.$_SESSION["moneda"], 0, 1, 'R');
		$pdf->SetXY(57, $h+$y+6+$z);//modificar solo esto
		$pdf->CellFitScale(15, 3,number_format(($sbt),2), 0, 1, 'R');
		$pdf->SetXY(2, $h+$y+6+$z+3);//modificar solo esto
		$pdf->CellFitScale(55, 3,'IGV('.$data->igv.'): '.$_SESSION["moneda"], 0, 1, 'R');
		$pdf->SetXY(57, $h+$y+6+$z+3);//modificar solo esto
		$pdf->CellFitScale(15, 3,number_format(($igv),2), 0, 1, 'R');
		$pdf->SetXY(2, $h+$y+6+$z+6);//modificar solo esto
		$pdf->CellFitScale(55, 3,'Dscto: '.$_SESSION["moneda"], 0, 1, 'R');
		$pdf->SetXY(57, $h+$y+6+$z+6);//modificar solo esto
		$pdf->CellFitScale(15, 3,'-'.number_format(($data->descu),2), 0, 1, 'R');
		$a = 9;
	}
	/*$y+6+$z+$a...*/
	$pdf->SetXY(2, $h+$y+6+$z+$a);//modificar solo esto
	$pdf->CellFitScale(70, 3,'----------------------------------------------', 0, 1, 'L');
	$pdf->SetXY(2, $h+$y+6+$z+$a+3);//modificar solo esto
	$pdf->CellFitScale(55, 3,'TOTAL A PAGAR: '.$_SESSION["moneda"], 0, 1, 'R');
	$pdf->SetXY(57, $h+$y+6+$z+$a+3);//modificar solo esto
	$pdf->CellFitScale(15, 3,number_format(($data->total - $data->descu),2), 0, 1, 'R');
	$pdf->SetXY(2, $h+$y+6+$z+$a+6);//modificar solo esto
	$pdf->CellFitScale(70, 3,'----------------------------------------------', 0, 1, 'L');
	$pdf->SetXY(2, $h+$y+6+$z+$a+9);//modificar solo esto
	$pdf->CellFitScale(70, 3,'SON: '.numtoletras($data->total - $data->descu), 0, 1, 'L');
	$pdf->SetXY(2, $h+$y+6+$z+$a+15);//modificar solo esto
	$pdf->SetFont('Arial','',7);
	$pdf->MultiCell(70, 3,'Gracias por su preferencia',0,'C',0,15);
	$pdf->SetXY(2, $h+$y+6+$z+$a+20);//modificar solo esto
	$pdf->MultiCell(70, 3,utf8_decode($texto),0,'J',0,15);
}
$pdf->AutoPrint(true);
$pdf->Output();
?>
