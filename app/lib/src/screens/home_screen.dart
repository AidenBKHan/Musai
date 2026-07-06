import 'package:flutter/material.dart';

import '../models/safety_index.dart';
import '../services/safety_index_api.dart';
import '../widgets/home_widget_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final _api = SafetyIndexApi();
  final _searchController = TextEditingController();

  SafetyIndex? _current;
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _api.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _search(String query) async {
    if (query.trim().isEmpty) return;
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final results = await _api.search(query.trim());
      if (results.isEmpty) {
        setState(() {
          _error = '"$query"에 대한 안전지수를 찾을 수 없습니다.';
          _current = null;
        });
        return;
      }
      setState(() => _current = results.first);
      await HomeWidgetService.pushSafetyIndex(results.first);
    } on SafetyIndexApiException catch (e) {
      setState(() => _error = e.message);
    } finally {
      setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Musai · 글로벌 안전지수')),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextField(
              controller: _searchController,
              decoration: const InputDecoration(
                hintText: '국가 또는 도시 검색 (예: Seoul, France)',
                border: OutlineInputBorder(),
                suffixIcon: Icon(Icons.search),
              ),
              onSubmitted: _search,
            ),
            const SizedBox(height: 24),
            if (_loading) const Center(child: CircularProgressIndicator()),
            if (_error != null)
              Text(_error!, style: TextStyle(color: Theme.of(context).colorScheme.error)),
            if (_current != null) _SafetyIndexCard(index: _current!),
          ],
        ),
      ),
    );
  }
}

class _SafetyIndexCard extends StatelessWidget {
  final SafetyIndex index;

  const _SafetyIndexCard({required this.index});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              index.regionName != null
                  ? '${index.regionName}, ${index.countryName}'
                  : index.countryName,
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              index.score.toStringAsFixed(1),
              style: Theme.of(context).textTheme.displayMedium,
            ),
            const SizedBox(height: 4),
            Text('출처: ${index.sourceName}'),
            const SizedBox(height: 16),
            ...index.factors.map(
              (f) => Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(f.label),
                    Text(f.score.toStringAsFixed(1)),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
