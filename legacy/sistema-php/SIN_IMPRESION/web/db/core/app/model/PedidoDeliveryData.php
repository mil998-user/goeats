<?php
class PedidoDeliveryData {
	public static $tablename = "tm_pedido_delivery";



	public function PedidoDeliveryData(){
		
		
	}
	//public function getCliente(){ return ClientesData::getById($this->codcliente);}
	
	public function add(){
		$sql = "insert into tm_pedido_delivery (id_pedido,nro_pedido,nomb_cliente,direccion,telefono,comentario,motorizado) ";
		$sql .= "value (\"$this->id_pedido\",\"$this->nro_pedido\",\"$this->nomb_cliente\",\"$this->direccion\",\"$this->telefono\",\"$this->comentario\",\"$this->motorizado\")";
		return Executor::doit($sql);
	}

	public static function delById($id){
		$sql = "delete from ".self::$tablename." where id_pedido=$id";
		Executor::doit($sql);
	}
	public function del(){
		$sql = "delete from ".self::$tablename." where id_pedido=$this->id_pedido";
		Executor::doit($sql);
	}

// partiendo de que ya tenemos creado un objecto UserData previamente utilizamos el contexto

 
	public static function getById($id){
		$sql = "select * from ".self::$tablename." where id_pedido=$id";
		$query = Executor::doit($sql); 
		return Model::one($query[0],new PedidoDeliveryData());

	}

	public static function getUltimoProcess(){
		$sql = "select * from ".self::$tablename."  order by idventa desc ";
		$query = Executor::doit($sql);
		return Model::many($query[0],new PedidoDeliveryData());

	}

	
	public static function getAll(){
		$sql = "select * from ".self::$tablename;
		$query = Executor::doit($sql);
		return Model::many($query[0],new PedidoDeliveryData());
	}
	
	


}

?>