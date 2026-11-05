import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/menu_models.dart';
import '../../cart/providers/cart_provider.dart';

class ProductDetailSheet extends ConsumerStatefulWidget {
  final MenuItem item;
  final int restaurantId;

  const ProductDetailSheet({super.key, required this.item, required this.restaurantId});

  static void show(BuildContext context, MenuItem item, int restaurantId) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => ProductDetailSheet(item: item, restaurantId: restaurantId),
    );
  }

  @override
  ConsumerState<ProductDetailSheet> createState() => _ProductDetailSheetState();
}

class _ProductDetailSheetState extends ConsumerState<ProductDetailSheet> {
  int _quantity = 1;
  MenuItemVariant? _selectedVariant;
  final _commentsController = TextEditingController();

  @override
  void initState() {
    super.initState();
    if (widget.item.variants.isNotEmpty) {
      _selectedVariant = widget.item.variants.first;
    }
  }

  Future<bool> _confirmReplaceCart() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('¿Empezar un carrito nuevo?'),
        content: const Text(
          'Tu carrito tiene productos de otro restaurante. Si continúas, se vaciará.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancelar'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('Vaciar y agregar'),
          ),
        ],
      ),
    );
    return confirmed ?? false;
  }

  Future<void> _addToCart() async {
    final variant = _selectedVariant;
    if (variant == null) return;

    final cart = ref.read(cartProvider);
    final isOtherRestaurant =
        cart.items.isNotEmpty && cart.restaurantId != widget.restaurantId;
    if (isOtherRestaurant) {
      final confirmed = await _confirmReplaceCart();
      if (!confirmed || !mounted) return;
    }

    final cartNotifier = ref.read(cartProvider.notifier);
    cartNotifier.setRestaurant(widget.restaurantId);
    cartNotifier.addItem(
      variantId: variant.id,
      name: variant.name,
      itemName: widget.item.name,
      price: variant.price,
      quantity: _quantity,
      comments: _commentsController.text,
    );
    Navigator.pop(context);
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Agregado al carrito')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      maxChildSize: 0.9,
      minChildSize: 0.5,
      expand: false,
      builder: (_, controller) => Column(
        children: [
          Expanded(
            child: ListView(
              controller: controller,
              children: [
                if (widget.item.image != null)
                  Image.network(
                    widget.item.image!,
                    height: 250,
                    width: double.infinity,
                    fit: BoxFit.cover,
                  )
                else
                  Container(
                    height: 200,
                    color: Colors.grey[200],
                    child: const Icon(Icons.fastfood, size: 64, color: Colors.grey),
                  ),
                Padding(
                  padding: const EdgeInsets.all(24.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(widget.item.name, style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold)),
                      const SizedBox(height: 8),
                      if (widget.item.description != null)
                        Text(widget.item.description!, style: Theme.of(context).textTheme.bodyLarge),
                      const SizedBox(height: 24),
                      
                      const Text('Elige tu presentación', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      ...widget.item.variants.map((v) => RadioListTile<MenuItemVariant>(
                        title: Text(v.name),
                        subtitle: Text('\$${v.price.toStringAsFixed(2)}'),
                        value: v,
                        groupValue: _selectedVariant,
                        onChanged: (val) => setState(() => _selectedVariant = val),
                        contentPadding: EdgeInsets.zero,
                        activeColor: Theme.of(context).colorScheme.primary,
                      )),
                      
                      const SizedBox(height: 24),
                      const Text('Comentarios especiales', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 12),
                      TextField(
                        controller: _commentsController,
                        decoration: InputDecoration(
                          hintText: 'Ej. Sin cebolla, extra salsa...',
                          border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        ),
                        maxLines: 2,
                      ),
                      
                      const SizedBox(height: 32),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          IconButton(
                            onPressed: _quantity > 1 ? () => setState(() => _quantity--) : null,
                            icon: const Icon(Icons.remove_circle_outline),
                            iconSize: 32,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                          Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 24),
                            child: Text('$_quantity', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                          ),
                          IconButton(
                            onPressed: () => setState(() => _quantity++),
                            icon: const Icon(Icons.add_circle_outline),
                            iconSize: 32,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                        ],
                      ),
                      const SizedBox(height: 100), // padding for bottom bar
                    ],
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.all(24.0),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))],
            ),
            child: SafeArea(
              child: ElevatedButton(
                onPressed: _selectedVariant == null ? null : _addToCart,
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size.fromHeight(50),
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: Text(
                  'Agregar \$${((_selectedVariant?.price ?? 0) * _quantity).toStringAsFixed(2)}',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
