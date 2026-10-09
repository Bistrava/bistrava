# Administration Bistrava

## Accès

Ouvrir `/admin` puis se connecter avec le compte Supabase disposant d’un rôle actif dans `admin_roles`. Le bouton de langue permet de passer du slovène au français. Le choix est conservé dans le navigateur.

Les administrateurs peuvent modifier les données. Les éditeurs consultent les opérations commerciales en lecture seule. Les visiteurs sont redirigés vers la connexion. Les pages Admin sont exclues de l’indexation et des outils de mesure publicitaires.

## Rubriques

| Rubrique | Fonctionnement |
| --- | --- |
| Tableau de bord | Produits publiés, unités en stock, commandes, clients, encaissements nets sur 30 jours, six mois de ventes, alertes de stock. |
| Produits | Créer un brouillon, rédiger la fiche, choisir une catégorie, gérer prix, stock, SEO, publication et archivage. Les nouvelles fiches viennent directement de Supabase. |
| Photos | Ajouter des images JPG, PNG, WebP ou AVIF de 3 Mo maximum ; choisir l’image principale, modifier les descriptions et l’ordre du carrousel. Jusqu’à 20 images. |
| Stock | Rechercher un produit, saisir la quantité totale et le motif, consulter les 50 derniers mouvements. Les alertes commencent à 5 unités. |
| Commandes | Rechercher et filtrer, consulter articles, coordonnées, adresses, paiement, notes et livraison. |
| Clients | Historique des commandes et adresses ; modifier le nom, téléphone et langue des comptes clients. Les achats invités sont inclus dans le suivi. Les comptes du personnel ne sont pas traités comme clients. |
| Livraisons | Définir les zones en Slovénie, tarifs et bornes minimum/maximum inclusives du panier TTC avant code promotionnel, hors livraison. Une borne vide signifie aucune limite. Les deux estimations de délai sont facultatives : les laisser toutes deux vides ou renseigner une paire cohérente de 1 à 90 jours ouvrés. Gérer transporteur, numéro et lien de suivi depuis la commande. |
| Promotions | Codes de réduction en pourcentage ou montant fixe, dates, minimum d’achat, quotas et archivage. Le total est recalculé côté serveur. |
| Messages | Voir les demandes du formulaire dès leur arrivée, ajouter des notes internes, suivre leur traitement. Les réponses sont encore envoyées depuis votre propre messagerie. |
| Guides | Créer ou modifier les articles, sections, paragraphes, tableaux comparatifs et métadonnées SEO ; publier ou archiver. |
| E-mails | Consulter les 100 derniers événements enregistrés, avec actualisation automatique. Cette rubrique est un journal ; la boîte de réception et la réponse intégrée restent à connecter. |
| Analyses | Encaissements issus des paiements enregistrés, diminués des remboursements. Les commandes impayées ne sont pas comptées comme recettes. |
| Journal | Les 100 dernières modifications auditées avec auteur et date. |

## Créer un produit

1. Ouvrir **Produits → Créer un produit**. Renseigner au minimum le nom, la marque, le SKU et une URL unique. Enregistrer le brouillon.
2. Ajouter les photos. Compléter le prix, la disponibilité, les délais, la garantie, les caractéristiques et les textes SEO.
3. Passer le statut à **Actif** et enregistrer. Les informations requises sont contrôlées avant publication.

L’URL d’une fiche existante reste stable afin de préserver les liens. L’archivage retire le produit de la boutique tout en préservant l’historique des commandes. Retirer une image de la galerie conserve son fichier dans Storage pour éviter une suppression irréversible involontaire.

## Messages et actualisation automatique

Les rubriques Messages et E-mails écoutent les insertions et modifications autorisées par Supabase Realtime. « En direct » apparaît après confirmation de la connexion. Un contrôle toutes les 30 secondes, lorsque l’onglet est visible, et au retour dans l’onglet rattrape les événements manqués.

Chaque abonnement attend la session navigateur puis transmet son jeton à Realtime avant de rejoindre le canal. Sans session, seul le contrôle périodique reste actif. Un nom de canal unique par initialisation évite de réutiliser une connexion en cours de fermeture.

L’actualisation de Messages se met en pause pendant la modification d’une note ou d’un statut. Enregistrer ou annuler reprend l’actualisation. Les brouillons sont conservés lors des revalidations de la liste ; une version devenue obsolète est refusée à l’enregistrement pour ne pas écraser le travail d’un autre administrateur. Les brouillons ne sont pas sauvegardés entre un rechargement complet ou la fermeture de la page.

La migration `202610090018` publie uniquement `quote_requests` et `email_events`, avec les règles de lecture réservées au personnel actif. Le journal e-mail n’accepte plus d’insertion depuis le navigateur ; ses futures écritures proviendront du serveur et d’événements vérifiés.

Au 9 octobre 2026, aucun service d’envoi ni boîte e-mail n’est configuré en production. L’actualisation du journal ne crée pas d’événement d’envoi : le raccordement des notifications au journal, la réception des e-mails et les réponses intégrées nécessitent encore l’adresse Bistrava à utiliser, son fournisseur et la configuration décrite dans [Email and DNS](email-and-dns.md).

## Traiter une commande

Une commande peut passer de **En attente** à **Attente paiement**, puis à **Payée**, **En préparation**, **Expédiée** et **Terminée**. Les étapes incompatibles sont refusées. Une commande impayée peut être annulée : les réservations de stock et les usages de code promotionnel sont libérés une seule fois, dans la même transaction.

Pour un paiement manuel, la validation requiert la confirmation explicite de la réception des fonds et une référence. Cette action enregistre un encaissement déjà reçu ; elle ne débite aucune carte. Les remboursements par prestataire de paiement ne sont pas exécutables depuis cette version.

Le suivi de colis enregistre des informations et un lien HTTPS. Il ne génère pas d’étiquette et ne commande pas de transport auprès d’un transporteur.

## Ouverture des ventes

La grille de livraison pour la Slovénie est configurée : **4,50 € TTC jusqu’à 80,00 € de produits inclus**, puis **livraison gratuite dès 80,01 €**. Le montant de référence comprend la TVA, avant code promotionnel et hors livraison. Une promotion ne fait donc pas perdre la gratuité acquise avec ce montant. Les tarifs reposent sur le [comparatif des livraisons en Slovénie du 9 octobre 2026](shipping-benchmark-2026-10-09.md).

La prise de commandes et le paiement restent désactivés. Le transporteur et ses délais doivent encore être finalisés ; aucune estimation de délai n’est renseignée dans les tarifs configurés. Les nouveaux tarifs créés dans l’Admin sont inactifs par défaut. L’activation technique des ventes passe par l’environnement sécurisé du projet, et non par les formulaires de l’Admin.

Les codes promotionnels sont reliés au calcul de commande. Ils sont consommés avec la réservation du stock, et non lors de la simple saisie du code. Le client doit confirmer le total remisé avant de commander. L’annulation d’une commande impayée restitue l’utilisation ; un remboursement après paiement ne réactive pas automatiquement le code.

## Déploiement et vérifications

Migrations `202610080012` à `202610080016` : fonctions transactionnelles, droits de lecture/écriture, promotions, indicateurs et import des dix guides existants. La migration `202610090017` ajoute la gestion des bornes de panier et des délais facultatifs aux tarifs de livraison. Les migrations de contenu conservent les articles déjà présents sur un même slug.

```powershell
pnpm.cmd typecheck
pnpm.cmd lint
pnpm.cmd test
pnpm.cmd build
```

Pour exécuter les contrôles SQL complets sur une base isolée en mémoire :

```powershell
npm.cmd install --prefix tmp/promotion-sql-test --no-save --package-lock=false --ignore-scripts @electric-sql/pglite
node scripts/test-promotions-db.mjs
```

Le script applique les migrations à PostgreSQL en mémoire, contrôle les permissions, remises, stocks, annulations, clients, messages, guides, bornes de livraison et conflits concurrents. Il n’utilise aucun secret et n’écrit pas dans Supabase. Les suites complémentaires `supabase/tests/admin_products.sql` et `supabase/tests/shipping_thresholds.sql` s’exécutent dans des transactions annulées.

Le renouvellement des sessions se trouve dans `src/proxy.ts`, à côté de `src/app`, avec un périmètre limité à `/admin`. Les pages et chaque action conservent leurs propres contrôles d’autorisation.
