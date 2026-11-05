<?php
include_once("model/rest.model.php");

class InventarioModel
{
    private $conexionn;

    public function __CONSTRUCT()
    {
        try
        {
            $this->conexionn = Database::Conectar();
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function listar()
    {
        try
        {
            $tipo_ip = $_POST['tipo_ip'];
            $id_ip = $_POST['id_ip'];
            $stm = $this->conexionn->prepare("SELECT id_inv,id_tipo_ope,id_ope,id_tipo_ins,id_ins,cos_uni,cant,fecha_r,estado FROM tm_inventario WHERE id_tipo_ins = ? AND id_ins = ?");
            $stm->execute(array($tipo_ip,$id_ip));
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            foreach($c as $k => $d)
            {
                $c[$k]->{'Precio'} = $this->conexionn->query("SELECT ROUND(AVG(cos_uni),2) AS cos_pro FROM tm_inventario WHERE id_tipo_ins = ".$d->id_tipo_ins." AND id_ins = ".$d->id_ins)
                    ->fetch(PDO::FETCH_OBJ);

                $c[$k]->{'Dato'} = $this->conexionn->query("SELECT nomb_med FROM v_insprod WHERE id_tipo_ins = ".$d->id_tipo_ins." AND id_ins = ".$d->id_ins)
                    ->fetch(PDO::FETCH_OBJ);

                if($d->id_tipo_ope == 1){
                    $c[$k]->{'Comp'} = $this->conexionn->query("SELECT serie_doc AS ser_doc,num_doc AS nro_doc,desc_td FROM v_compras WHERE id_compra = ".$d->id_ope)
                    ->fetch(PDO::FETCH_OBJ);
                } else if($d->id_tipo_ope == 2){
                    $c[$k]->{'Comp'} = $this->conexionn->query("SELECT ser_doc,nro_doc,desc_td FROM v_ventas_con WHERE id_ven = ".$d->id_ope)
                    ->fetch(PDO::FETCH_OBJ);
                } else if($d->id_tipo_ope == 3 OR $d->id_tipo_ope == 4){
                    $c[$k]->{'Comp'} = $this->conexionn->query("SELECT motivo FROM tm_inventario_entsal WHERE id_es = ".$d->id_ope)
                    ->fetch(PDO::FETCH_OBJ);
                }
            }
            
            $data = array("data" => $c);
            $json = json_encode($data);
            echo $json; 
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function ComboInsumoProducto($data)
    {
        try
        {   
            $stmm = $this->conexionn->prepare("SELECT id_ins,cod_ins,nomb_ins FROM v_insprod WHERE id_tipo_ins = ?");
            $stmm->execute(array($data['cod']));
            $var = $stmm->fetchAll(PDO::FETCH_ASSOC);
            foreach($var as $v){
                echo '<option value="'.$v['id_ins'].'">'.$v['cod_ins'].' - '.$v['nomb_ins'].'</option>';
            }
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }
}