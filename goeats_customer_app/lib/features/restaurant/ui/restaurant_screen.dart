import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../providers/catalog_provider.dart';
import 'widgets/menu_item_card.dart';
import 'product_detail_sheet.dart';
import '../../cart/ui/cart_bottom_bar.dart';

class RestaurantScreen extends ConsumerWidget {
  final String slug;

  const RestaurantScreen({super.key, required this.slug});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final catalogAsync = ref.watch(catalogProvider(slug));

    return Scaffold(
      body: catalogAsync.when(
        data: (data) {
          final restaurant = data.restaurant;
          final categories = data.categories;

          return Stack(
            children: [
              CustomScrollView(
                slivers: [
                  SliverAppBar(
                    expandedHeight: 250,
                    pinned: true,
                    flexibleSpace: FlexibleSpaceBar(
                      title: Text(restaurant.name),
                      background: restaurant.coverImage != null
                          ? Image.network(restaurant.coverImage!, fit: BoxFit.cover)
                          : Container(color: Theme.of(context).colorScheme.primary),
                    ),
                  ),
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (restaurant.description != null) ...[
                            Text(restaurant.description!, style: Theme.of(context).textTheme.bodyLarge),
                            const SizedBox(height: 16),
                          ],
                          Row(
                            children: [
                              const Icon(Icons.star, color: Colors.amber, size: 20),
                              const SizedBox(width: 4),
                              const Text('4.8', style: TextStyle(fontWeight: FontWeight.bold)),
                              const SizedBox(width: 16),
                              if (restaurant.address != null) ...[
                                const Icon(Icons.location_on, color: Colors.grey, size: 20),
                                const SizedBox(width: 4),
                                Expanded(child: Text(restaurant.address!, maxLines: 1, overflow: TextOverflow.ellipsis)),
                              ]
                            ],
                          ),
                          const Divider(height: 32),
                        ],
                      ),
                    ),
                  ),
                  ...categories.map((category) {
                    return SliverMainAxisGroup(
                      slivers: [
                        SliverPersistentHeader(
                          pinned: true,
                          delegate: _CategoryHeaderDelegate(category.name),
                        ),
                        SliverPadding(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          sliver: SliverList(
                            delegate: SliverChildBuilderDelegate(
                              (context, index) {
                                final item = category.items[index];
                                return MenuItemCard(
                                  item: item,
                                  onTap: () => ProductDetailSheet.show(context, item, restaurant.id),
                                );
                              },
                              childCount: category.items.length,
                            ),
                          ),
                        ),
                      ],
                    );
                  }),
                  const SliverToBoxAdapter(child: SizedBox(height: 100)), // padding for cart bar
                ],
              ),
              const Positioned(
                bottom: 0,
                left: 0,
                right: 0,
                child: CartBottomBar(),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48, color: Colors.red),
              const SizedBox(height: 16),
              const Text('Error al cargar el restaurante'),
              TextButton(
                onPressed: () => ref.refresh(catalogProvider(slug)),
                child: const Text('Reintentar'),
              )
            ],
          ),
        ),
      ),
    );
  }
}

class _CategoryHeaderDelegate extends SliverPersistentHeaderDelegate {
  final String title;

  _CategoryHeaderDelegate(this.title);

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: Theme.of(context).scaffoldBackgroundColor,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      child: Text(
        title,
        style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
      ),
    );
  }

  @override
  double get maxExtent => 50;

  @override
  double get minExtent => 50;

  @override
  bool shouldRebuild(covariant SliverPersistentHeaderDelegate oldDelegate) => false;
}
