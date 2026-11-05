<?php
class PedidoData {
	public static $tablename = "tm_pedido";



	public function PedidoData(){
		
		
	}
	//public function getCliente(){ return ClientesData::getById($this->codcliente);}
	
	public function add(){
		$sql = "insert into tm_pedido (id_tipo_pedido,id_usu,fecha_pedido,estado) ";
		$sql .= "value ($this->id_tipo_pedido,$this->id_usu,\"$this->fecha_pedido\",\"$this->estado\")";
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
		return Model::one($query[0],new PedidoData());

	}

	

	
	public static function getAll(){
		$sql = "select * from ".self::$tablename;
		$query = Executor::doit($sql);
		return Model::many($query[0],new PedidoData());
	}
	
	


}

?>