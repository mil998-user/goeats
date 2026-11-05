<div class="modal inmodal fade" id="mdl-sub-pedido" tabindex="-1" role="dialog" aria-hidden="true" data-backdrop="static" data-keyboard="true">
    <div class="modal-dialog">
        <div class="modal-content animated bounceInRight">
        <form method="post" enctype="multipart/form-data" action="#">
            <div class="modal-header mh-e">
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Cerrar</span></button>
                <h4 class="modal-title mt title-subitems animated fadeIn"></h4>
            </div>
            <div class="modal-body" style="padding: 0px">
                <ul class="sortable-list agile-list">
                    <div class="scroll_subitems" id="list-subitems"></div>
                </ul>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-white" data-dismiss="modal">Volver</button>
            </div>
        </form>
        </div>
    </div>
</div>

<div class="modal inmodal fade" id="mdl-cancelar-pedido" tabindex="-1" role="dialog" aria-hidden="true" data-backdrop="static" data-keyboard="true">
    <div class="modal-dialog modal-sm">
        <div class="modal-content animated bounceInRight">
        <form method="post" enctype="multipart/form-data" action="?c=Inicio&a=CancelarPedido">
            <input type="hidden" name="cod_ped" id="cod_ped">
            <input type="hidden" name="cod_pres" id="cod_pres">
            <input type="hidden" name="fec_ped" id="fec_ped">
            <input type="hidden" name="cod_tipe" value=""/>
            <input type="hidden" name="cod_pag" value=""/>
            <div class="modal-header mh-p">
                <button type="button" class="close" data-dismiss="modal"><span aria-hidden="true">&times;</span><span class="sr-only">Cerrar</span></button>
                <i class="fa fa-times modal-icon"></i>
            </div>
            <div class="modal-body">
                <br><h4><div id="mensaje-e"></div></h4><br>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-white" data-dismiss="modal">Cancelar</button>
                <button type="submit" class="btn btn-primary"><i class="fa fa-check-square-o"></i> Aceptar</button>
            </div>
        </form>
        </div>
    </div>
</div>