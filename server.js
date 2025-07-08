const express = require('express');
+const cors = require('cors');
+const rateLimit = require('express-rate-limit');
+const helmet = require('helmet');
+require('dotenv').config();

+const app = express();
+const PORT = process.env.PORT || 3001;

+// Middleware de sécurité
+app.use(helmet());
+app.use(cors({
+  origin: process.env.NODE_ENV === 'production' 
+    ? ['https://votre-domaine.com'] // Remplacez par votre domaine
+    : ['http://localhost:5173', 'http://localhost:3000']
+}));

+app.use(express.json({ limit: '10mb' }));

+// Rate limiting
+const limiter = rateLimit({
+  windowMs: 15 * 60 * 1000, // 15 minutes
+  max: 20, // 20 requêtes par IP par fenêtre
+  message: {
+    error: 'Trop de requêtes, réessayez dans 15 minutes.'
+  }
+});

+app.use('/api/', limiter);

+// Route de chat avec OpenAI
+app.post('/api/v1/chat', async (req, res) => {
+  try {
+    const { message, context, history } = req.body;

+    if (!message) {
+      return res.status(400).json({ error: 'Message requis' });
+    }

+    // Validation de la clé API OpenAI côté serveur
+    const openaiApiKey = process.env.OPENAI_API_KEY;
+    if (!openaiApiKey) {
+      console.error('OPENAI_API_KEY non configurée');
+      return res.status(500).json({ error: 'Service temporairement indisponible' });
+    }

+    // Import dynamique d'OpenAI
+    const { OpenAI } = await import('openai');
+    const openai = new OpenAI({ apiKey: openaiApiKey });

+    const systemPrompt = `Tu es un expert en emailing marketing et développement d'emails HTML/CSS avec accès à une bibliothèque de composants.

+${context}

+INSTRUCTIONS IMPORTANTES:
+- Utilise TOUJOURS les composants de la bibliothèque quand c'est pertinent
+- Référence les composants par leur nom et ID exact
+- Adapte le code des composants si nécessaire
+- Explique les bonnes pratiques spécifiques aux composants
+- Mentionne la compatibilité des clients email
+- Sois concis mais précis (max 300 mots)
+- Utilise un ton professionnel mais accessible
+- Si tu utilises un composant, mentionne son ID entre crochets [ID]

+DOMAINES D'EXPERTISE:
+- Bonnes pratiques d'emailing
+- Compatibilité multi-clients (Outlook, Gmail, Apple Mail, etc.)
+- Accessibilité des emails (WCAG 2.1)
+- Optimisation du code HTML/CSS pour emails
+- Techniques VML pour Outlook
+- Responsive design pour emails
+- Tests et débogage
+- Utilisation des composants de la bibliothèque`;

+    const messages = [
+      { role: 'system', content: systemPrompt },
+      ...history.slice(-4), // Limiter l'historique
+      { role: 'user', content: message }
+    ];

+    const completion = await openai.chat.completions.create({
+      model: 'gpt-4o-mini',
+      messages,
+      max_tokens: 400,
+      temperature: 0.7,
+    });

+    const response = completion.choices[0].message.content || 'Désolé, je n\'ai pas pu générer une réponse.';

+    res.json({ response });

+  } catch (error) {
+    console.error('Erreur OpenAI:', error);
+    
+    let errorMessage = 'Erreur interne du serveur';
+    let statusCode = 500;
+    
+    if (error.status === 401) {
+      errorMessage = 'Configuration API invalide';
+      statusCode = 500; // Ne pas exposer les détails d'auth
+    } else if (error.status === 429) {
+      errorMessage = 'Service temporairement surchargé, réessayez dans quelques minutes';
+      statusCode = 429;
+    } else if (error.code === 'insufficient_quota') {
+      errorMessage = 'Service temporairement indisponible';
+      statusCode = 503;
+    }
+    
+    res.status(statusCode).json({ error: errorMessage });
+  }
+});

+// Route de santé
+app.get('/api/health', (req, res) => {
+  res.json({ status: 'OK', timestamp: new Date().toISOString() });
+});

+// Gestion des erreurs 404
+app.use('*', (req, res) => {
+  res.status(404).json({ error: 'Endpoint non trouvé' });
+});

+// Gestion globale des erreurs
+app.use((error, req, res, next) => {
+  console.error('Erreur serveur:', error);
+  res.status(500).json({ error: 'Erreur interne du serveur' });
+});

+app.listen(PORT, () => {
+  console.log(`Serveur backend démarré sur le port ${PORT}`);
+  console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
+});
+
# Si ce n'est pas déjà fait, initialisez Git dans le dossier backend
cd backend
git init
git add .
git commit -m "Initial backend setup"

# Poussez vers GitHub (créez un repo si nécessaire)
git remote add origin https://github.com/Bourgeois-dev/email-components-backend.git
git push -u origin maincd backend
git init
git add .
git commit -m "Initial backend setup"

# Poussez vers GitHub (créez un repo si nécessaire)
git remote add origin https://github.com/Bourgeois-dev/email-components-backend.git
git push -u origin main

