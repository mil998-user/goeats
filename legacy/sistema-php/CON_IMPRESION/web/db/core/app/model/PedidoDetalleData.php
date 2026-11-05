<?php
class PedidoDetalleData {
	public static $tablename = "tm_detalle_pedido";



	public function PedidoDetalleData(){
		
		
	}
	public function getPedido(){ return PedidoData::getById($this->id_pedido);}
	
	public function add(){
		$sql = "insert into tm_detalle_pedido (id_pedido,id_pres,cantidad,cant,precio,comentario,fecha_pedido,fecha_envio,estado) ";
		$sql .= "value (\"$this->id_pedido\",\"$this->id_pres\",\"$this->cantidad\",\"$this->cant\",\"$this->precio\",\"$this->comentario\",\"$this->fecha_pedido\",\"$this->fecha_envio\",\"$this->estado\")";
		Executor::doit($sql);
	}

	

// partiendo de que ya tenemos creado un objecto UserData previamente utilizamos el contexto

 
	

	
	public static function getAll(){
		$sql = "select * from ".self::$tablename;
		$query = Executor::doit($sql);
		return Model::many($query[0],new PedidoDetalleData());
	}
	
	


}

?>