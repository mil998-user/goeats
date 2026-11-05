<?php
include_once("model/rest.model.php");

class InformeModel
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

    public function Datos()
    {
        try
        {
            $ifecha = date('Y-m-d',strtotime($_POST['ifecha']));
            $ffecha = date('Y-m-d',strtotime($_POST['ffecha']));
            $stm = $this->conexionn->prepare("SELECT dp.id_prod,SUM(dp.cantidad) AS cantidad,dp.precio,IFNULL((SUM(dp.cantidad)*dp.precio),0) AS total,v.fecha_venta FROM tm_detalle_venta AS dp INNER JOIN tm_venta AS v ON dp.id_venta = v.id_venta INNER JOIN v_productos AS vp ON vp.id_pres = dp.id_prod WHERE DATE(v.fecha_venta) >= ? AND DATE(v.fecha_venta) <= ? AND vp.id_catg like ? AND vp.id_prod like ? AND vp.id_pres like ? GROUP BY dp.id_prod , DATE(v.fecha_venta) ORDER BY DATE(v.fecha_venta) DESC, SUM(dp.cantidad) DESC");
            $stm->execute(array($ifecha,$ffecha,$_POST['codCat'],$_POST['codPro'],$_POST['codPre']));
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            foreach($c as $k => $d)
            {
                $c[$k]->{'Producto'} = $this->conexionn->query("SELECT nombre_prod,pres_prod,desc_c FROM v_productos WHERE id_pres = ".$d->id_prod)
                    ->fetch(PDO::FETCH_OBJ);
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

    public function Categoria()
    {
        try
        {      
            $stm = $this->conexionn->prepare("SELECT * FROM tm_producto_catg");
            $stm->execute();            
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            $stm->closeCursor();
            return $c;
            $this->conexionn=null;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function Producto()
    {
        try
        {      
            $stm = $this->conexionn->prepare("SELECT * FROM tm_producto");
            $stm->execute();            
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            $stm->closeCursor();
            return $c;
            $this->conexionn=null;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function Presentacion()
    {
        try
        {      
            $stm = $this->conexionn->prepare("SELECT * FROM tm_producto_pres");
            $stm->execute();            
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            $stm->closeCursor();
            return $c;
            $this->conexionn=null;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function combPro($data)
    {
        try
        {
            $stm = $this->conexionn->prepare("SELECT * FROM tm_producto WHERE id_catg = ?");
            $stm->execute(array($data['cod']));
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            return $c;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function combPre($data)
    {
        try
        {
            $stm = $this->conexionn->prepare("SELECT * FROM tm_producto_pres WHERE id_prod = ?");
            $stm->execute(array($data['cod']));
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            return $c;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }
}