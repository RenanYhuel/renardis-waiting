# 🐳 Guide de Déploiement Docker - Renardis

## 📋 Prérequis

- Docker installé sur votre système
- Docker Compose installé
- Variables d'environnement Notion configurées

## 🚀 Déploiement rapide

### 1. Cloner le projet

```bash
git clone <repository-url>
cd renardis-waiting
```

### 2. Configurer les variables d'environnement

```bash
# Copier le fichier d'exemple
cp .env.example .env.local

# Éditer avec vos vraies valeurs Notion
nano .env.local
```

### 3. Build et lancer avec Docker Compose

```bash
# Installer la dépendance sonner
npm install sonnet

# Build et démarrer en arrière-plan
docker compose up -d --build

# Voir les logs
docker compose logs -f

# Arrêter
docker compose down
```

### 4. Accéder au site

Le site sera disponible sur : **http://localhost:3000**

---

## 🛠️ Commandes utiles

### Build manuel

```bash
# Build l'image Docker
docker build -t renardis-web .

# Lancer le container
docker run -p 3000:3000 --env-file .env.local renardis-web
```

### Debug et maintenance

```bash
# Voir les logs
docker compose logs renardis-web

# Redémarrer le service
docker compose restart renardis-web

# Rebuild après modifications
docker compose up -d --build --force-recreate

# Nettoyer (attention, supprime tout)
docker compose down -v --rmi all
```

### Accéder au container

```bash
# Shell dans le container
docker compose exec renardis-web sh

# Voir les processus
docker compose exec renardis-web ps aux
```

---

## 🔧 Configuration avancée

### Variables d'environnement

- `NOTION_API_KEY` : Token de votre intégration Notion
- `NOTION_CONTACT_DATABASE_ID` : ID de la base Contact
- `NOTION_CANDIDATURE_DATABASE_ID` : ID de la base Candidatures
- `NOTION_VERSION` : Version API Notion (optionnel)

### Ports personnalisés

```yaml
# Dans docker-compose.yml
ports:
  - "8080:3000" # Accès via localhost:8080
```

### Mode développement avec Docker

```yaml
# Ajouter dans docker-compose.yml
environment:
  - NODE_ENV=development
volumes:
  - .:/app
  - /app/node_modules
```

---

## 🌐 Déploiement en production

### Avec un reverse proxy (Nginx)

```nginx
server {
    listen 80;
    server_name votre-domaine.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Avec SSL (Let's Encrypt)

```bash
# Installer certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir le certificat
sudo certbot --nginx -d votre-domaine.com
```

---

## 🔍 Monitoring et logs

### Voir les métriques

```bash
# Stats du container
docker stats renardis-web

# Utilisation des ressources
docker compose top
```

### Logs en temps réel

```bash
# Tous les services
docker compose logs -f

# Service spécifique
docker compose logs -f renardis-web
```

---

## ⚠️ Troubleshooting

### Problèmes courants

1. **Port déjà utilisé**

   ```bash
   sudo lsof -i :3000
   sudo kill -9 <PID>
   ```

2. **Variables d'environnement non prises en compte**

   ```bash
   docker compose down
   docker compose up -d --force-recreate
   ```

3. **Build qui échoue**

   ```bash
   docker system prune -a
   docker compose build --no-cache
   ```

4. **Notion API ne fonctionne pas**
   - Vérifier les IDs des bases de données
   - Vérifier que l'intégration a accès aux bases
   - Vérifier le token API

---

## 📈 Optimisations

### Multi-stage build optimisé

Le Dockerfile utilise déjà un build multi-stage pour :

- ✅ Images plus légères
- ✅ Sécurité renforcée (pas de dev dependencies)
- ✅ Cache optimisé

### Health checks

```yaml
# Ajouter dans docker-compose.yml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:3000"]
  interval: 30s
  timeout: 10s
  retries: 3
```

---

**🎉 Votre site Renardis est maintenant prêt pour la production !**
