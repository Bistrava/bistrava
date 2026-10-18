# Préparation de l’hébergement Render

État du 18 octobre 2026. La branche `codex/finalisation-render` est publiée dans la [PR draft #1](https://github.com/Bistrava/bistrava/pull/1), au HEAD `c0ef8d017bd864f77809a348d7dd4cd64a132e8e`. Les 52 fichiers du lot publié ont été comparés exactement aux sources ; `main` reste au commit `a7dcc4c99826cd636334ec050bdfd6697c9094fe`.

La connexion Render est effectuée et le formulaire de création est préparé. L’exploitant a approuvé la création payante et les frais présentés. Après clic sur Deploy, la fenêtre Add Card attend sa saisie directe de carte ; aucun identifiant, URL de service ni confirmation de création observé. Aucun secret Supabase ou LWS n’a été transféré. Le site public reste sur Vercel jusqu’à une migration approuvée et vérifiée.

## Solution proposée et coût

Un Web Service Docker Render en région Frankfurt, une instance `0.5c-512mb` (0,5 CPU, 512 Mo), à partir de **7 $/mois**, plus taxes et éventuels dépassements. Le workspace Hobby gratuit comprend actuellement 5 Go de trafic sortant et 500 minutes de compilation ; trafic supplémentaire à 0,15 $/Go. Les ressources et tarifs doivent être confirmés sur l’écran de création avant achat. La RAM de 512 Mo doit être évaluée avec le catalogue, les images et la messagerie ; le palier `1c-2g` coûte actuellement 25 $/mois. [Tarification](https://render.com/pricing), [quotas](https://render.com/docs/new-workspace-plans), [régions](https://render.com/docs/regions).

La création d’une instance payante lance la facturation du calcul, au prorata de la seconde d’activité, y compris pour une Preview. Le trafic vers les visiteurs et les services externes contribue au quota sortant ; 5 Go sont partagés par le workspace Hobby, puis 0,15 $/Go sur Internet public. Le tarif de 7 $ ne plafonne donc pas les éventuels dépassements. [Facturation et prorata](https://render.com/docs/faq), [trafic sortant](https://render.com/docs/outbound-bandwidth).

LWS est conservé pour le domaine et la messagerie, Supabase pour les données. Render Free bloque les ports SMTP, dont 465 utilisé par Bistrava ; une instance payante les autorise. Railway Hobby bloque aussi SMTP, avec Pro à 20 $ minimum pour conserver ce transport. [SMTP Render](https://render.com/changelog/free-web-services-will-no-longer-allow-outbound-traffic-to-smtp-ports), [SMTP Railway](https://docs.railway.com/networking/outbound-networking).

## Fichiers de déploiement

- `Dockerfile` : Node 24, pnpm 10.33.0, installation verrouillée, sortie Next standalone, utilisateur non privilégié, assets publics et images optimisées.
- `.dockerignore` : secrets locaux, caches, sources commerciales et rapports exclus du contexte.
- `render.yaml` : une instance Frankfurt, déploiement automatique désactivé, commandes fermées et indexation interdite pour la revue.
- `/health` : contrôle de vie du processus uniquement ; il ne prouve pas que la base ou les e-mails sont configurés.
- `scripts/smoke-hosting.mjs` : contrôle HTTP de la compilation, des données publiques du vendeur, des images, de l’indexation et du rejet d’une origine étrangère sur la messagerie. Aucun e-mail ni commande créé.
- `.github/workflows/verify.yml` : compilation Linux et test du conteneur sans secrets de production, avec droits GitHub en lecture uniquement.

Le [run CI Linux](https://github.com/Bistrava/bistrava/actions/runs/39082019805) a réussi : TypeScript, lint, 182 tests, PGlite isolé, construction Docker et contrôle HTTP du conteneur. Il ne déploie pas sur Render et ne crée ni commande distante ni e-mail réel.

La Preview Vercel est Ready et ses [informations publiques de contact/vendeur/retours](https://bistrava-git-codex-finalisation-render-bistrava.vercel.app/kontakt) ont été vérifiées en lecture seule. Le défaut de l’adaptateur Next 16.3.2 est contourné dans `next.config.ts` avec `output: process.env.VERCEL === "1" ? undefined : "standalone"` : Vercel utilise son adaptateur et Render/Docker conservent standalone. Les variables système Vercel ont été inspectées pendant ce diagnostic.

Le déploiement portable conserve les Server Actions, les sessions, le Proxy, l’administration, les connexions TCP IMAP/SMTP et les appels Supabase. Les compteurs anti-abus sont bornés mais restent propres à un processus ; ne pas ajouter d’instances sans partager ces compteurs. Les données métier sont dans Supabase, aucun disque Render n’est prévu. [Next en Node/Docker](https://nextjs.org/docs/app/getting-started/deploying), [sortie standalone](https://nextjs.org/docs/app/api-reference/config/next-config-js/output).

## Formulaire préparé, création approuvée

Le formulaire utilise **Public Git Repository** avec `https://github.com/Bistrava/bistrava` et les réglages suivants :

| Réglage | Valeur préparée |
| --- | --- |
| Nom | `bistrava` |
| Branche | `codex/finalisation-render` |
| Runtime | Docker |
| Région | Frankfurt |
| Instance | `0.5c-512mb`, 7 $/mois, une instance |
| Health check | `/health` |
| Port | `10000` |
| Auto-deploy | Off |
| Commandes | `CHECKOUT_ORDERING_ENABLED=false` |
| Indexation | `ROBOTS_INDEXING_ENABLED=false` |
| URL publique | `NEXT_PUBLIC_SITE_URL=https://bistrava.com`, valeur provisoire |

La création effective attend l’étape Add Card malgré l’approbation reçue. Cette interface annonce une vérification temporaire de 1 $ non facturée ; aucune opération bancaire n’a été vérifiée. Une première instance sera non configurée pour Supabase et LWS tant que les valeurs approuvées ne lui seront pas fournies. Après création, remplacer l’URL publique provisoire par l’origine réelle du domaine de test Render et reconstruire avant de tester l’administration ou la messagerie. La configuration finale du domaine public sera une étape ultérieure. L’import par dépôt public n’active pas les déploiements Git automatiques ; les mises à jour passent par un déploiement manuel. [Web Services Render](https://render.com/docs/web-services).

## Configuration à fournir dans Render

Pour une instance connectée, les valeurs publiques `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` doivent être fournies avant sa compilation. L’application peut compiler sans configuration Supabase et ferme alors les fonctions connectées. L’URL doit correspondre exactement à l’origine utilisée dans le navigateur, y compris pour la Preview, car la messagerie protège les mutations avec cette origine configurée.

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

1. La création payante du service préparé et les frais présentés sont approuvés. L’exploitant complète directement Add Card ; confirmer ensuite la création et les éventuelles étapes d’acceptation des conditions.
2. Créer le service de revue initialement non configuré, utiliser son origine de test réelle puis reconstruire. La compilation Linux est déjà validée en CI ; vérifier ensuite l’interface et la consommation mémoire sur Render.
3. Sur une base de test approuvée, vérifier migrations, RLS, panier, commande, réservation, confirmation, virement, doublon, annulation et stock restitué. Tester les connexions SMTP/IMAP depuis Render, puis l’acheminement à un destinataire autorisé.
4. Préparer la sauvegarde/restauration Supabase et valider la migration de TVA avant toute application en production.
5. Après accord final, configurer l’URL publique `https://bistrava.com`, revoir les mentions de l’hébergeur et la confidentialité, autoriser l’indexation et reconstruire.
6. Rattacher les domaines et attendre le TLS. Changer seulement les enregistrements web nécessaires chez LWS ; conserver MX, SPF, DKIM et DMARC. Tester l’apex, www, redirections, commandes, administration et e-mails. Garder le déploiement Vercel précédent disponible pour retour arrière tant que le basculement n’est pas validé.
7. Activer le virement et le drapeau d’ouverture seulement après les contrôles et l’accord final. Le déploiement ou le Blueprint seul ne vaut pas autorisation de vente.
