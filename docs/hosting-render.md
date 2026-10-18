# Hébergement Render : création et vérifications

État du 18 octobre 2026. La référence applicative déjà publiée pour la messagerie est `0e8188b` sur `codex/finalisation-render`, dans la [PR draft #1](https://github.com/Bistrava/bistrava/pull/1) : 60 fichiers audités, [CI réussie](https://github.com/Bistrava/bistrava/actions/runs/39086467655) et Preview Vercel `BnW8htEXKG6ot2qUnJ2YtDG931G4` Ready. Elle est Live sur Render, déploiement `dep-dba29d8m7kps73f6hpl0` ; `main` reste au commit `a7dcc4c99826cd636334ec050bdfd6697c9094fe`. Le nouveau lot fiscal de 7 fichiers est prêt localement avec 38 fichiers/215 tests, TypeScript et lint ciblé réussis ; sa nouvelle CI et sa Preview restent à obtenir après publication. Les documents présents sont postérieurs à l’audit applicatif de référence.

Le service Render **`srv-dba1njrrjlhs738imm4g`** est créé, avec l’URL attribuée **`https://bistrava.onrender.com`**. L’exploitant a ajouté lui-même sa carte et la notification Render confirme le service payant ; la facturation au prorata a commencé. Le contrôle HTTP du service réussit : santé, pages publiques, vendeur, images, indexation interdite et protection d’origine, sans commande ni envoi d’e-mail par ce contrôle. L’URL canonique et `og:url` correspondent à l’origine Render. `RATE_LIMIT_SALT` a été généré directement dans l’interface, sans copie de sa valeur. La configuration Supabase publique et serveur a été transférée avec accord et le mot de passe LWS saisi directement par l’exploitant. Les authentifications SMTP et IMAP ont réussi dans le shell sans envoi, puis le bouton « Preveri SMTP » a réussi dans l’administration. Le site public reste sur Vercel et les DNS n’ont pas changé.

Le contrôle navigateur Render retrouve les **24 produits réels**, dont Cintropur à **125,90 €**, stock affiché **15**. L’ajout d’un article au panier puis l’accès au checkout affichent « Sprejem naročil še ni aktiviran » avec validation désactivée. Aucun formulaire de commande n’a été rempli ni soumis ; le panier a été vidé ensuite. Cette vérification confirme la lecture du catalogue et la fermeture des commandes, sans créer de commande de production.

Un test de contact explicitement autorisé a confirmé la réception de l’accusé et de la notification interne ; aucune commande. Virement, commandes et indexation restent désactivés.

Le nouveau bloc Admin présente les montants fiscaux figés en lecture seule pour préparer des factures externes ; il n’émet aucune facture. Erika Kozjan a validé le calcul actuel à 22 %, les arrondis par ligne et leur reprise en facture ; une future allocation multi-taux reste distincte. Le retour arrière ciblé fondé sur la capture réelle et les six cas de refus/rollback atomique du wrapper transactionnel ont réussi localement. Il n’y a eu aucun DDL en production. **La migration TVA doit être appliquée avant le déploiement du nouveau bloc**, dont la sélection utilise les nouvelles colonnes. La capture ciblée ne remplace pas une sauvegarde complète, toujours non réalisée.

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
- `.github/workflows/verify.yml` : compilation Linux et test du conteneur sans secrets de production, plus un job distinct de commande connecté à Supabase local sous Docker ; droits GitHub en lecture uniquement. Le scénario A/B existant ajoute l’assertion DOM fiscale et une capture synthétique. `actions/upload-artifact@v7.0.2` conservera `test-results/connected/**/admin-accounting.png` pendant trois jours sous `admin-accounting-preview`. Cette nouvelle exécution et son artefact restent en attente de la prochaine CI.

La référence historique [CI Linux `0e8188b`](https://github.com/Bistrava/bistrava/actions/runs/39086467655) a réussi : TypeScript, lint, tests applicatifs, PGlite isolé, construction Docker et contrôle HTTP du conteneur. Le job Supabase local exécute les vrais formulaires : commande A annulée avec restitution unique du stock et accès invité protégé par cookie ; commande B avec paiement reçu enregistré, préparation puis expédition, contrôlées par API/DB. Les données sont synthétiques et la messagerie est désactivée. Ce run ne déploie pas sur Render, ne crée aucune commande de production et ne prouve pas la livraison d’un e-mail ; celle-ci a fait l’objet du test autorisé distinct. Il ne constitue pas un résultat de la nouvelle assertion fiscale ni du lot local à 215 tests.

La Preview Vercel de référence `0e8188b` est Ready, déploiement `BnW8htEXKG6ot2qUnJ2YtDG931G4` ; la nouvelle Preview fiscale attend la publication. Les [informations publiques de contact/vendeur/retours](https://bistrava-git-codex-finalisation-render-bistrava.vercel.app/kontakt) ont également fait l’objet d’une revue en lecture seule. Le défaut de l’adaptateur Next 16.3.2 est contourné dans `next.config.ts` avec `output: process.env.VERCEL === "1" ? undefined : "standalone"` : Vercel utilise son adaptateur et Render/Docker conservent standalone. La configuration Playwright connectée est exclue de l’upload Vercel comme son script importé ; la simulation des fichiers envoyés et TypeScript passent localement.

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
| LWS | Mot de passe saisi directement par l’exploitant ; SMTP/IMAP et réception du test autorisé vérifiés |

La carte a été ajoutée directement par l’exploitant, le service payant est confirmé et sa facturation a commencé. Le déploiement `dep-dba29d8m7kps73f6hpl0`, source `0e8188b`, est Live avec Supabase et LWS configurés. Smoke HTTP, catalogue réel, checkout fermé et authentifications SMTP/IMAP sont vérifiés. Le domaine public `bistrava.com` n’a pas été basculé. L’import par dépôt public n’active pas les déploiements Git automatiques ; les mises à jour passent par un déploiement manuel. [Web Services Render](https://render.com/docs/web-services).

Aucune association de domaine Render n’a été effectuée. La revue automatique a refusé cette action parce que l’autorisation couvrait la préparation ; les DNS restent inchangés. L’approbation finale regroupée de la migration, du déploiement fiscal puis de la bascule et de l’ouverture reste à demander. Auto-deploy reste Off et la version Render actuelle demeure `0e8188b`.

## Configuration à fournir dans Render

Pour une instance connectée, les valeurs publiques `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` doivent être fournies avant sa compilation. L’application peut compiler sans configuration Supabase et ferme alors les fonctions connectées. L’URL doit correspondre exactement à l’origine utilisée dans le navigateur, y compris pour la Preview, car la messagerie protège les mutations avec cette origine configurée.

Le Dockerfile déclare uniquement des arguments publics et le réglage d’indexation. `SUPABASE_SECRET_KEY`, `LWS_MAIL_PASSWORD` et les éventuels secrets Resend restent des variables d’exécution. Ne jamais les mettre dans GitHub, un Docker `ARG`, un fichier copié dans l’image ou un journal. Avec l’accord de l’exploitant, l’URL et la clé publique Supabase ont été copiées depuis Vercel Production. La clé serveur Vercel étant Sensitive et non révélable, une clé serveur existante a été récupérée dans l’interface API Keys de Supabase et transférée dans Render, sans créer ni renouveler de clé. Leur présence a été confirmée dans Render ; aucune valeur n’est consignée dans le dépôt. Le mot de passe LWS a été saisi directement par l’exploitant dans Render, sans copie dans le dépôt. Les coordonnées bancaires déjà enregistrées dans Supabase ne sont pas à recopier dans le dépôt. [Variables Docker Render](https://render.com/docs/docker), [Blueprint](https://render.com/docs/blueprint-spec).

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

1. Obtenir les résultats de la nouvelle CI/Preview et compléter la revue finale, puis mesurer la consommation mémoire. La source de référence `0e8188b` reste Live ; canonique, `og:url`, smoke HTTP, catalogue réel et checkout fermé sont vérifiés.
2. SMTP/IMAP sont vérifiés. Un test de contact explicitement autorisé a confirmé la réception de l’accusé et de la notification interne ; aucune commande. Garder les commandes et l’indexation fermées ; tout nouvel envoi de test nécessite sa propre autorisation.
3. Le parcours de commande isolé a réussi en CI avec Supabase local et sans messagerie. Aucun test de commande de production n’a été réalisé sur Render. Si un nouveau test de commande hébergé est nécessaire, utiliser une base de test approuvée et distincte.
4. Conserver la capture réelle et les PASS du retour arrière ciblé ainsi que des six cas du wrapper transactionnel. La sauvegarde/restauration complète reste distincte et non réalisée. Après approbation finale, appliquer la migration TVA avant de déployer le bloc fiscal Admin ; aucun DDL de production n’a encore été effectué.
5. Après accord final, configurer l’URL publique `https://bistrava.com`, revoir les mentions de l’hébergeur et la confidentialité, autoriser l’indexation et reconstruire.
6. Après l’approbation finale regroupée, rattacher les domaines et attendre le TLS. Cette association n’a pas été faite après le refus de la revue automatique pour périmètre d’autorisation insuffisant. Changer seulement les enregistrements web nécessaires chez LWS ; conserver MX, SPF, DKIM et DMARC. Tester l’apex, www, redirections, commandes, administration et e-mails. Garder le déploiement Vercel précédent disponible pour retour arrière tant que le basculement n’est pas validé.
7. Activer le virement et le drapeau d’ouverture seulement après les contrôles et l’accord final. Le déploiement ou le Blueprint seul ne vaut pas autorisation de vente.
