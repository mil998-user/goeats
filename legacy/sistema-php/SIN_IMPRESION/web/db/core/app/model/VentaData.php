<?php
class VentaData {
	public static $tablename = "ventas";
 


	public function VentaData(){
		
		
	}
	public function getCliente(){ return ClientesData::getById($this->codcliente);}
	
	public function add(){
		$sql = "insert into ventas (codventa,codcaja,codcliente,codmesa,subtotalivasive,subtotalivanove,ivave,totalivave,descuentove,totaldescuentove,totalpago,totalpago2,tipopagove,formapagove,montopagado,montodevuelto,fechavencecredito,statusventa,statuspago,fechaventa,codigo,cocinero,delivery,repartidor,entregado,observaciones,codarqueocaja,comprobante,serie_doc,aceptado,enviado) ";
		$sql .= "value (\"$this->codventa\",\"$this->codcaja\",\"$this->codcliente\",\"$this->codmesa\",\"$this->subtotalivasive\",\"$this->subtotalivanove\",\"$this->ivave\",\"$this->totalivave\",\"$this->descuentove\",\"$this->totaldescuentove\",\"$this->totalpago\",\"$this->totalpago2\",\"$this->tipopagove\",\"$this->formapagove\",\"$this->montopagado\",\"$this->montodevuelto\",\"$this->fechavencecredito\",\"$this->statusventa\",\"$this->statuspago\",\"$this->fechaventa\",\"$this->codigo\",\"$this->cocinero\",\"$this->delivery\",\"$this->repartidor\",\"$this->entregado\",\"$this->observaciones\",\"$this->codarqueocaja\",\"$this->comprobante\",\"$this->serie_doc\",\"$this->aceptado\",\"$this->enviado\")";
		return Executor::doit($sql);
	}

	public static function delById($id){
		$sql = "delete from ".self::$tablename." where idventa=$id";
		Executor::doit($sql);
	}
	public function del(){
		$sql = "delete from ".self::$tablename." where idventa=$this->idventa";
		Executor::doit($sql);
	}

// partiendo de que ya tenemos creado un objecto UserData previamente utilizamos el contexto

 
	public static function getById($id){
		$sql = "select * from ".self::$tablename." where idventa=$id";
		$query = Executor::doit($sql); 
		return Model::one($query[0],new VentaData());

	}

	public static function getUltimoProcess(){
		$sql = "select * from ".self::$tablename." where enviado=1 order by idventa desc ";
		$query = Executor::doit($sql);
		return Model::many($query[0],new VentaData());

	}

	
	public static function getAll(){
		$sql = "select * from ".self::$tablename;
		$query = Executor::doit($sql);
		return Model::many($query[0],new VentaData());
	}
	
	


}

?>