<?php
include_once("model/rest.model.php");

class ConfigModel
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

    //RESTAURANTE
    public function ListarSM()
    {
        try
        {      
            $stm = $this->conexionn->prepare("SELECT * FROM v_mesas");
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

    public function ListarCSM()
    {
        try
        {      
            $stm = $this->conexionn->prepare("SELECT * FROM tm_catg_mesa");
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

    //DATOS DE LA EMPRESA
    public function ObtenerDE()
    {
        try
        {      
            $stm = $this->conexionn->prepare("SELECT * FROM tm_empresa");
            $stm->execute();
            $r = $stm->fetch(PDO::FETCH_OBJ);

            $alm = new Datos();

            $alm->__SET('id_de', $r->id_de);
            $alm->__SET('trib_acr', $r->trib_acr);
            $alm->__SET('trib_car', $r->trib_car);
            $alm->__SET('di_acr', $r->di_acr);
            $alm->__SET('di_car', $r->di_car);
            $alm->__SET('imp_acr', $r->imp_acr);
            $alm->__SET('imp_val', $r->imp_val);
            $alm->__SET('imp_icbper', $r->imp_icbper);
            $alm->__SET('mon_acr', $r->mon_acr);
            $alm->__SET('mon_val', $r->mon_val);
            $alm->__SET('ruc', $r->ruc);
            $alm->__SET('raz_soc', $r->raz_soc);
            $alm->__SET('direccion', $r->direccion);
            $alm->__SET('logo', $r->logo);

            return $alm;
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function ActualizarDE(Datos $data)
    {
        try 
        {
            $sql = "UPDATE tm_empresa SET

                trib_acr = ?,
                trib_car = ?,
                di_acr = ?,
                di_car = ?,
                imp_acr = ?,
                imp_val = ?,
                imp_icbper = ?,
                mon_acr = ?,
                mon_val = ?,
                ruc = ?,
                raz_soc  = ?,
                direccion = ?,
                logo = ?

            WHERE id_de = ?";

            $this->conexionn->prepare($sql)
                 ->execute(
                array(
                    $data->__GET('trib_acr'), 
                    $data->__GET('trib_car'), 
                    $data->__GET('di_acr'),
                    $data->__GET('di_car'),
                    $data->__GET('imp_acr'),
                    $data->__GET('imp_val'),
                    $data->__GET('imp_icbper'),
                    $data->__GET('mon_acr'),
                    $data->__GET('mon_val'),
                    $data->__GET('ruc'),
                    $data->__GET('raz_soc'),
                    $data->__GET('direccion'),
                    $data->__GET('logo'),                    
                    $data->__GET('id_de')
                    )
                );
            /* ACTUALIZAR DATOS */
            $_SESSION["imp_icbper"] = $data->__GET('imp_icbper');
            $_SESSION["igv"] = $data->__GET('imp_val');
            $_SESSION["moneda"] = $data->__GET('mon_val');
            $_SESSION["tribAcr"] = $data->__GET('trib_acr');
            $_SESSION["tribCar"] = $data->__GET('trib_car');
            $_SESSION["diAcr"] = $data->__GET('di_acr');
            $_SESSION["diCar"] = $data->__GET('di_car');
            $_SESSION["impAcr"] = $data->__GET('imp_acr');
            $_SESSION["monAcr"] = $data->__GET('mon_acr');
        } catch (Exception $e) 
        {
            die($e->getMessage());
        }
    }

    //TIPO DE DOCUMENTO
    public function ListarTD()
    {
        try
        {      
            $stm = $this->conexionn->prepare("SELECT * FROM tm_tipo_doc");
            $stm->execute();            
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            $data = array("data" => $c);
            $json = json_encode($data);
            echo $json; 
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function GuardarTD($data)
    {
        try 
        {
            $sql = "UPDATE tm_tipo_doc SET serie = ?,numero = ? WHERE id_tipo_doc = ?";
            $this->conexionn->prepare($sql)->execute(array($data['serie'],$data['numero'],$data['cod_td']));
        } catch (Exception $e) 
        {
            die($e->getMessage());
        }
    }

    public function obtenerDatos($cod)
    {
        try 
        {
            $stm = $this->conexionn->prepare("SELECT * FROM tm_tipo_doc WHERE id_tipo_doc = ?");
            $stm->execute(array($cod));
            $r = $stm->fetch(PDO::FETCH_OBJ);
            $alm = new TipoDoc();
            $alm->__SET('id_tipo_doc', $r->id_tipo_doc);
            $alm->__SET('descripcion', $r->descripcion);
            $stm->closeCursor();
        return $alm;
        $this->conexionn=null;
        } catch (Exception $e) 
        {
            die($e->getMessage());
        }
    }

 
    //TIRAJE DE COMPROBANTES

    public function ListarTirajes()
    {
        try
        {
            $cod = $_POST['cod'];
            $stm = $this->conexionn->prepare("SELECT * FROM tm_tiraje WHERE id_comprobante like ? ORDER BY idtiraje ASC");
            $stm->execute(array($cod));
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            foreach($c as $k => $d)
            {
                $c[$k]->{'Salon'} = $this->conexionn->query("SELECT descripcion FROM tm_tipo_doc WHERE id_tipo_doc = ".$d->id_comprobante)
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

    public function obtenerDatosTiraje($cod)
    {
        try 
        {
            $stm = $this->conexionn->prepare("SELECT * FROM tm_tiraje WHERE idtiraje = ?");
            $stm->execute(array($cod));
            $r = $stm->fetch(PDO::FETCH_OBJ);
            $alm = new Tiraje();
            $alm->__SET('idtiraje', $r->idtiraje);
            $alm->__SET('contribuyente', $r->contribuyente);
            $alm->__SET('regimen', $r->regimen);
            $alm->__SET('ciudad', $r->ciudad);
            $alm->__SET('serie', $r->serie);
            $alm->__SET('aut_sri', $r->aut_sri);
            $alm->__SET('desde', $r->desde);
            $alm->__SET('hasta', $r->hasta);
            $alm->__SET('id_comprobante', $r->id_comprobante);
            $alm->__SET('disponibles', $r->disponibles);
            $alm->__SET('imprenta', $r->imprenta);
            $alm->__SET('imp_dueno', $r->imp_dueno);
            $alm->__SET('imp_ruc', $r->imp_ruc);
            $alm->__SET('imp_num_aut', $r->imp_num_aut);
            $alm->__SET('imp_fecha_emision', $r->imp_fecha_emision);
            $alm->__SET('imp_valido', $r->imp_valido);
            $alm->__SET('imp_fecha_valido', $r->imp_fecha_valido);
            $alm->__SET('estado', $r->estado);
            $stm->closeCursor();
        return $alm;
        $this->conexionn=null;
        } catch (Exception $e) 
        {
            die($e->getMessage());
        }
    }


    public function editar(Tiraje $data)
    {
        try 
        {
            $consulta = "call usp_restRegTiraje( :flag, :contribuyente, :regimen, :ciudad, :serie, :aut_sri, :desde, :hasta, :id_comprobante, :disponibles, :imprenta, :imp_dueno, :imp_ruc, :imp_num_aut, :imp_fecha_emision, :imp_valido, :imp_fecha_valido, :estado, :idtiraje);";
              $arrayParam =  array(
                  ':flag' => 2,
                  ':contribuyente' => $data->__GET('contribuyente'),
                  ':regimen' => $data->__GET('regimen'),
                  ':ciudad' => $data->__GET('ciudad'),
                  ':serie' => $data->__GET('serie'),
                  ':aut_sri' => $data->__GET('aut_sri'),
                  ':desde' => $data->__GET('desde'),
                  ':hasta' => $data->__GET('hasta'),
                  ':id_comprobante' => $data->__GET('id_comprobante'),
                  ':disponibles' => $data->__GET('disponibles'),
                  ':imprenta' => $data->__GET('imprenta'),
                  ':imp_dueno' => $data->__GET('imp_dueno'),
                  ':imp_ruc' => $data->__GET('imp_ruc'),
                  ':imp_num_aut' => $data->__GET('imp_num_aut'),
                  ':imp_fecha_emision' => $data->__GET('imp_fecha_emision'),
                  ':imp_valido' => $data->__GET('imp_valido'),
                  ':imp_fecha_valido' => $data->__GET('imp_fecha_valido'),
                  ':estado' => $data->__GET('estado'),
                  ':idtiraje' => $data->__GET('idtiraje')
              );
              $st = $this->conexionn->prepare($consulta);
              $st->execute($arrayParam);
        } catch (Exception $e) 
        {
            die($e->getMessage());
        }
    }


    public function registrar(Tiraje $data)
    {
            try 
            {
                    $consulta = "call usp_restRegTiraje( :flag, :contribuyente, :regimen, :ciudad, :serie, :aut_sri, :desde, :hasta, :id_comprobante, :disponibles, :imprenta, :imp_dueno, :imp_ruc, :imp_num_aut, :imp_fecha_emision, :imp_valido, :imp_fecha_valido, :estado, @a);";
                    $telefono = 0;
                    if($data->__GET('contribuyente') != '' and $data->__GET('contribuyente') != null){
                        
                        $contribuyente = $data->__GET('contribuyente');
                    }
                  $arrayParam =  array(
                      ':flag' => 1,
                      ':contribuyente' => $contribuyente,
                      ':regimen' => $data->__GET('regimen'),
                      ':ciudad' => $data->__GET('ciudad'),
                      ':serie' => $data->__GET('serie'),
                      ':aut_sri' => $data->__GET('aut_sri'),
                      ':desde' => $data->__GET('desde'),
                      ':hasta' => $data->__GET('hasta'),
                      ':id_comprobante' => $data->__GET('id_comprobante'),
                      ':disponibles' => $data->__GET('disponibles'),
                      ':imprenta' => $data->__GET('imprenta'),
                      ':imp_dueno' => $data->__GET('imp_dueno'),
                      ':imp_ruc' => $data->__GET('imp_ruc'),
                      ':imp_num_aut' => $data->__GET('imp_num_aut'),
                      ':imp_fecha_emision' => $data->__GET('imp_fecha_emision'),
                      ':imp_valido' => $data->__GET('imp_valido'),
                      ':imp_fecha_valido' => $data->__GET('imp_fecha_valido'),
                      ':estado' => $data->__GET('estado')
                  );
                  $st = $this->conexionn->prepare($consulta);
                  $st->execute($arrayParam);
              $row = $st->fetch(PDO::FETCH_ASSOC);
          return $row;
            } catch (Exception $e) 
            {
                die($e->getMessage());
            }
    }


    

    

    //INDICADORES
    public function ListarI01()
    {
        try
        {      
            $stm = $this->conexionn->prepare("SELECT * FROM tm_margen_venta");
            $stm->execute();            
            $c = $stm->fetchAll(PDO::FETCH_OBJ);
            $data = array("data" => $c);
            $json = json_encode($data);
            echo $json; 
        }
        catch(Exception $e)
        {
            die($e->getMessage());
        }
    }

    public function GuardarI01($data)
    {
        try 
        {
            $sql = "UPDATE tm_margen_venta SET margen = ? WHERE id = ?";
            $this->conexionn->prepare($sql)->execute(array($data['m_venta'],$data['cod_ind']));
        } 
        catch (Exception $e) 
        {
            die($e->getMessage());
        }
    }

    public function Pais()
    {
        try
        {      
            $stm = $this->conexionn->prepare("SELECT * FROM tm_area_prod");
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
}