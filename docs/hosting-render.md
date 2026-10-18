# Hébergement Render : création et vérifications

État du 18 octobre 2026. Le lot applicatif de la branche `codex/finalisation-render`, repère `fc13`, est publié dans la [PR draft #1](https://github.com/Bistrava/bistrava/pull/1). Les 57 fichiers de ce lot ont été audités exactement. Ce bilan documentaire est rédigé après cet audit ; `main` reste au commit `a7dcc4c99826cd636334ec050bdfd6697c9094fe`.

Le service Render **`srv-dba1njrrjlhs738imm4g`** est créé, avec l’URL attribuée **`https://bistrava.onrender.com`**. L’exploitant a ajouté lui-même sa carte et la notification Render confirme le service payant ; la facturation au prorata a commencé. Le contrôle HTTP du service réussit : santé, pages publiques, vendeur, images, indexation interdite et protection d’origine, sans commande ni e-mail. Le troisième déploiement `dep-dba1pfeq1p3s73a05g2g` est Live ; l’URL canonique et `og:url` correspondent à l’origine Render. `RATE_LIMIT_SALT` a été généré directement dans l’interface, sans copie de sa valeur. La configuration Supabase publique et serveur a été transférée avec l’accord de l’exploitant et la lecture du catalogue réel est vérifiée sur Render. Le secret LWS manque encore et son champ est préparé pour saisie directe par l’exploitant. Le site public reste sur Vercel et les DNS n’ont pas changé.

Le contrôle navigateur Render retrouve les **24 produits réels**, dont Cintropur à **125,90 €**, stock affiché **15**. L’ajout d’un article au panier puis l’accès au checkout affichent « Sprejem naročil še ni aktiviran » avec validation désactivée. Aucun formulaire n’a été rempli ni soumis ; le panier a été vidé ensuite. Cette vérification confirme la lecture du catalogue et la fermeture des commandes, sans créer de commande de production.

## Instance créée et coût approuvé

Le Web Service Docker créé est en région Frankfurt, avec une instance `0.5c-512mb` (0,5 CPU, 512 Mo) à **7 $/mois**, conformément au plan et aux frais approuvés sur l’écran de création. Taxes et éventuels dépassements restent distincts du prix de l’instance. La consommation mémoire avec le catalogue, les images et la messagerie reste à mesurer sur le service après compilation. [Tarification](https://render.com/pricing), [quotas](https://render.com/docs/new-workspace-plans), [régions](https://render.com/docs/regions).

La notification Render confirme le démarrage de la facturation du service payant au prorata. Le trafic vers les visiteurs et les services externes contribue au quota sortant ; le prix de 7 $ ne plafonne pas les éventuels dépassements. [Facturation et prorata](https://render.com/docs/faq), [trafic sortant](https://render.com/docs/outbound-bandwidth).

LWS est conservé pour le domaine et la messagerie, Supabase pour les données. Render Free bloque les ports SMTP, dont 465 utilisé par Bistrava ; une instance payante les autorise. Railway Hobby bloque aussi SMTP, avec Pro à 20 $ minimum pour conserver ce transport. [SMTP Render](https://render.com/changelog/free-web-services-will-no-longer-allow-outbound-traffic-to-smtp-ports), [SMTP Railway](https://docs.railway.com/networking/outbound-networking).

## Fichiers de déploiement

- `Dockerfile` : Node 24, pnpm 10.33.0, installation verrouillée, sortie Next standalone, utilisateur non privilégié, assets publics et images optimisées.
- `.dockerignore` : secrets locaux, caches, sources commerciales et rapports exclus du contexte.
- `render.yaml` : une instance Frankfurt, déploiement automatique désactivé, commandes fermées et indexation interdite pour la revue.
- `/health` : contrôle de vie du processus uniquement ; il ne prouve pas que la base ou les e-mails sont configurés.
- `scripts/smoke-hosting.mjs` : contrôle HTTP de la compilation, des données publiques du vendeur, des images, de l’indexation et du rejet d’une origine étrangère sur la messagerie. Aucun e-mail ni commande créé.
- `.github/workflows/verify.yml` : compilation Linux et test du conteneur sans secrets de production, plus un job distinct de commande connecté à Supabase local sous Docker ; droits GitHub en lecture uniquement.

Le [run CI Linux du lot `e08`](https://github.com/Bistrava/bistrava/actions/runs/39084962778) a réussi : TypeScript, lint, 182 tests unitaires, PGlite isolé, construction Docker et contrôle HTTP du conteneur. Le job Supabase local a également exécuté les vrais formulaires : commande A annulée avec restitution unique du stock et accès invité protégé par cookie ; commande B avec paiement reçu enregistré, préparation puis expédition, contrôlées par API/DB. Les données sont synthétiques et la messagerie est désactivée. Ce run ne déploie pas sur Render, ne crée aucune commande de production et ne prouve pas la livraison d’un e-mail. Le [run `fc13`](https://github.com/Bistrava/bistrava/actions/runs/39085311797) est également Success, avec ses deux jobs réussis.

Une précédente Preview Vercel du lot `c0ef8d0` était Ready ; ses [informations publiques de contact/vendeur/retours](https://bistrava-git-codex-finalisation-render-bistrava.vercel.app/kontakt) ont été vérifiées en lecture seule. Le défaut de l’adaptateur Next 16.3.2 est contourné dans `next.config.ts` avec `output: process.env.VERCEL === "1" ? undefined : "standalone"` : Vercel utilise son adaptateur et Render/Docker conservent standalone. Le lot `e08` a ensuite compilé l’application sur Vercel mais échoué au contrôle TypeScript : la configuration Playwright importait un script exclu du paquet. Le lot `fc13` exclut également cette configuration de l’upload Vercel ; la simulation des fichiers envoyés et TypeScript passent localement. Sa Preview Vercel est maintenant Ready, déploiement `DnLC2ALeHxJpj7nHfrQ2CC9QBqoP`.

Le déploiement portable conserve les Server Actions, les sessions, le Proxy, l’administration, les connexions TCP IMAP/SMTP et les appels Supabase. Les compteurs anti-abus sont bornés mais restent propres à un processus ; ne pas ajouter d’instances sans partager ces compteurs. Les données métier sont dans Supabase, aucun disque Render n’est prévu. [Next en Node/Docker](https://nextjs.org/docs/app/getting-started/deploying), [sortie standalone](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).

## Service créé et réglages enregistrés

Le service utilise **Public Git Repository** avec `https://github.com/Bistrava/bistrava` et les réglages suivants :

| Réglage | Valeur enregistrée |
| --- | --- |
| Nom | `bistrava` |
| Identifiant | `srv-dba1njrrjlhs738imm4g` |
| URL attribuée | `https://bistrava.onrender.com` |
| Branche | `codex/finalisation-render` |
| Runtime | Docker |
| Région | Frankfurt |
| Instance | `0.5c-512mb`, 7 $/mois, une instance |
| Health check | `/health` |
| Port | `10000` |
| Auto-deploy | Off |
| Commandes | `CHECKOUT_ORDERING_ENABLED=false` |
| Indexation | `ROBOTS_INDEXING_ENABLED=false` |
| URL publique de revue | `NEXT_PUBLIC_SITE_URL=https://bistrava.onrender.com` |
| Protection anti-abus | `RATE_LIMIT_SALT` généré dans l’interface, valeur non copiée |
| Supabase public | URL et clé publique transférées depuis Vercel Production avec accord |
| Supabase serveur | Clé existante transférée depuis l’interface Supabase avec accord, sans création ni rotation |
| LWS | `LWS_MAIL_PASSWORD` absent ; champ préparé pour saisie directe par l’exploitant |

La carte a été ajoutée directement par l’exploitant, le service payant est confirmé et sa facturation a commencé. Le déploiement d’origine Render est Live et les métadonnées vérifiées. L’ajout des valeurs Supabase publiques a déclenché `dep-dba1rfmq1p3s73a0bo3g`, puis celui de la clé serveur `dep-dba1sjajnfac73e1pdbg` ; leur statut final reste à consigner. Le smoke HTTP et la lecture du catalogue connecté ont réussi ; les fonctions serveur authentifiées restent à vérifier. Le transfert LWS est autorisé mais son secret est encore absent : le formulaire d’édition est préparé pour une saisie directe et un enregistrement par l’exploitant. Le domaine public `bistrava.com` n’a pas été basculé. L’import par dépôt public n’active pas les déploiements Git automatiques ; les mises à jour passent par un déploiement manuel. [Web Services Render](https://render.com/docs/web-services).

## Configuration à fournir dans Render

Pour une instance connectée, les valeurs publiques `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` doivent être fournies avant sa compilation. L’application peut compiler sans configuration Supabase et ferme alors les fonctions connectées. L’URL doit correspondre exactement à l’origine utilisée dans le navigateur, y compris pour la Preview, car la messagerie protège les mutations avec cette origine configurée.

Le Dockerfile déclare uniquement des arguments publics et le réglage d’indexation. `SUPABASE_SECRET_KEY`, `LWS_MAIL_PASSWORD` et les éventuels secrets Resend restent des variables d’exécution. Ne jamais les mettre dans GitHub, un Docker `ARG`, un fichier copié dans l’image ou un journal. Avec l’accord de l’exploitant, l’URL et la clé publique Supabase ont été copiées depuis Vercel Production. La clé serveur Vercel étant Sensitive et non révélable, une clé serveur existante a été récupérée dans l’interface API Keys de Supabase et transférée dans Render, sans créer ni renouveler de clé. Leur présence a été confirmée dans Render ; aucune valeur n’est consignée dans le dépôt. Le mot de passe LWS de Vercel est également Sensitive : le champ Render vide est préparé pour saisie directe par l’exploitant, encore en attente. Les coordonnées bancaires déjà enregistrées dans Supabase ne sont pas à recopier dans le dépôt. [Variables Docker Render](https://render.com/docs/docker), [Blueprint](https://render.com/docs/blueprint-spec).

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

1. Consigner le statut final des déploiements Supabase et vérifier les fonctions serveur authentifiées, puis mesurer la consommation mémoire. Le déploiement d’origine est Live ; canonique, `og:url`, smoke HTTP, catalogue réel et checkout fermé sont vérifiés.
2. Attendre la saisie directe et l’enregistrement du secret LWS par l’exploitant, puis son déploiement. Garder les commandes et l’indexation fermées pendant les contrôles.
3. Le parcours de commande isolé a réussi en CI avec Supabase local et sans messagerie. Compléter les contrôles sur le runtime Render sans commande de production ; tester ses connexions SMTP/IMAP après configuration, puis l’acheminement à un destinataire explicitement autorisé. Si un nouveau test de commande hébergé est nécessaire, utiliser une base de test approuvée et distincte.
4. Préparer la sauvegarde/restauration Supabase et valider la migration de TVA avant toute application en production.
5. Après accord final, configurer l’URL publique `https://bistrava.com`, revoir les mentions de l’hébergeur et la confidentialité, autoriser l’indexation et reconstruire.
6. Rattacher les domaines et attendre le TLS. Changer seulement les enregistrements web nécessaires chez LWS ; conserver MX, SPF, DKIM et DMARC. Tester l’apex, www, redirections, commandes, administration et e-mails. Garder le déploiement Vercel précédent disponible pour retour arrière tant que le basculement n’est pas validé.
7. Activer le virement et le drapeau d’ouverture seulement après les contrôles et l’accord final. Le déploiement ou le Blueprint seul ne vaut pas autorisation de vente.
