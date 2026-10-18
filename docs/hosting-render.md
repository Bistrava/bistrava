# Préparation de l’hébergement Render

Version préparée le 17 octobre 2026 à la demande de l’exploitant. Aucun service Render ni abonnement n’a été créé. Le site public reste sur Vercel jusqu’à une migration approuvée et vérifiée.

## Solution proposée et coût

Un Web Service Docker Render en région Frankfurt, une instance `0.5c-512mb` (0,5 CPU, 512 Mo), à partir de **7 $/mois**, plus taxes et éventuels dépassements. Le workspace Hobby gratuit comprend actuellement 5 Go de trafic sortant et 500 minutes de compilation ; trafic supplémentaire à 0,15 $/Go. Les ressources et tarifs doivent être confirmés sur l’écran de création avant achat. La RAM de 512 Mo doit être évaluée avec le catalogue, les images et la messagerie ; le palier `1c-2g` coûte actuellement 25 $/mois. [Tarification](https://render.com/pricing), [quotas](https://render.com/docs/new-workspace-plans), [régions](https://render.com/docs/regions).

LWS est conservé pour le domaine et la messagerie, Supabase pour les données. Render Free bloque les ports SMTP, dont 465 utilisé par Bistrava ; une instance payante les autorise. Railway Hobby bloque aussi SMTP, avec Pro à 20 $ minimum pour conserver ce transport. [SMTP Render](https://render.com/changelog/free-web-services-will-no-longer-allow-outbound-traffic-to-smtp-ports), [SMTP Railway](https://docs.railway.com/networking/outbound-networking).

## Fichiers de déploiement

- `Dockerfile` : Node 24, pnpm 10.33.0, installation verrouillée, sortie Next standalone, utilisateur non privilégié, assets publics et images optimisées.
- `.dockerignore` : secrets locaux, caches, sources commerciales et rapports exclus du contexte.
- `render.yaml` : une instance Frankfurt, déploiement automatique désactivé, commandes fermées et indexation interdite pour la revue.
- `/health` : contrôle de vie du processus uniquement ; il ne prouve pas que la base ou les e-mails sont configurés.
- `scripts/smoke-hosting.mjs` : contrôle HTTP de la compilation, des données publiques du vendeur, des images, de l’indexation et du rejet d’une origine étrangère sur la messagerie. Aucun e-mail ni commande créé.
- `.github/workflows/verify.yml` : compilation Linux et test du conteneur sans secrets de production, avec droits GitHub en lecture uniquement.

Le déploiement portable conserve les Server Actions, les sessions, le Proxy, l’administration, les connexions TCP IMAP/SMTP et les appels Supabase. Les compteurs anti-abus sont bornés mais restent propres à un processus ; ne pas ajouter d’instances sans partager ces compteurs. Les données métier sont dans Supabase, aucun disque Render n’est prévu. [Next en Node/Docker](https://nextjs.org/docs/app/getting-started/deploying), [sortie standalone](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).

## Configuration à fournir dans Render

Les valeurs `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` doivent être présentes avant la compilation. L’URL doit correspondre exactement à l’origine utilisée dans le navigateur, y compris pour la Preview, car la messagerie protège les mutations avec cette origine configurée.

Le Dockerfile déclare uniquement des arguments publics et le réglage d’indexation. `SUPABASE_SECRET_KEY`, `LWS_MAIL_PASSWORD` et les éventuels secrets Resend restent des variables d’exécution. Ne jamais les mettre dans GitHub, un Docker `ARG`, un fichier copié dans l’image ou un journal. L’exploitant les saisira directement dans Render après validation de ce destinataire. Les coordonnées bancaires déjà enregistrées dans Supabase ne sont pas à recopier dans le dépôt. [Variables Docker Render](https://render.com/docs/docker), [Blueprint](https://render.com/docs/blueprint-spec).

Ne pas reprendre les données ou identifiants de production dans une Preview servant aux tests de commandes. Le projet Supabase de test doit être distinct et approuvé. `CHECKOUT_ORDERING_ENABLED=false` et `ROBOTS_INDEXING_ENABLED=false` restent en place jusqu’au lancement final.

## Vérification locale sans Docker

```powershell
pnpm build
pnpm prepare:standalone
$env:HOSTNAME = '127.0.0.1'
$env:PORT = '3100'
pnpm start:standalone
```

Dans un deuxième terminal :

```powershell
$env:BISTRAVA_PREVIEW_URL = 'http://127.0.0.1:3100'
node scripts/smoke-hosting.mjs
```

Pour tester le mode de revue, définir `ROBOTS_INDEXING_ENABLED=false` **avant compilation**, puis `BISTRAVA_EXPECT_NOINDEX=true` pour le contrôle. Construire l’image Docker sous Linux ; ne pas recopier le `node_modules` Windows dans un conteneur Linux.

## Passage du site public

1. Faire approuver le service, son prix et la connexion au seul dépôt Bistrava. L’exploitant réalise les étapes d’abonnement et d’acceptation des conditions.
2. Déployer la branche de revue, vérifier la compilation Linux, l’interface et la consommation mémoire.
3. Sur une base de test approuvée, vérifier migrations, RLS, panier, commande, réservation, confirmation, virement, doublon, annulation et stock restitué. Tester les connexions SMTP/IMAP depuis Render, puis l’acheminement à un destinataire autorisé.
4. Préparer la sauvegarde/restauration Supabase et valider la migration de TVA avant toute application en production.
5. Après accord final, configurer l’URL publique `https://bistrava.com`, revoir les mentions de l’hébergeur et la confidentialité, autoriser l’indexation et reconstruire.
6. Rattacher les domaines et attendre le TLS. Changer seulement les enregistrements web nécessaires chez LWS ; conserver MX, SPF, DKIM et DMARC. Tester l’apex, www, redirections, commandes, administration et e-mails. Garder le déploiement Vercel précédent disponible pour retour arrière tant que le basculement n’est pas validé.
7. Activer le virement et le drapeau d’ouverture seulement après les contrôles et l’accord final. Le déploiement ou le Blueprint seul ne vaut pas autorisation de vente.
