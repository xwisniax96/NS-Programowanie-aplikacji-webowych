import 'package:flutter/material.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        // Dodajemy belkę na górze
        appBar: AppBar(
          title: const Text("taki top to jest tytul"),
          backgroundColor: Colors.red, // Opcjonalnie: kolor belki
        ),
        body: const Center(
          child: Text(
            "to jest body",
            style: TextStyle(
              color: Colors.green, // Ustawienie zielonego koloru tekstu
              fontSize: 20,         // Opcjonalnie: powiększenie czcionki
            ),
          ),
        ),
      ),
    );
  }
}