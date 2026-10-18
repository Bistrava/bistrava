# Préparation de l’ouverture de Bistrava

État de travail du 17 octobre 2026. Objectif confirmé : recevoir de vraies commandes, avec **virement bancaire au lancement**. Base examinée : `main`, commit `a7dcc4c99826cd636334ec050bdfd6697c9094fe`. Ce document distingue ce qui a été observé des éléments encore à valider ; il ne constitue pas une autorisation d’ouverture.

## Vérifications effectuées

| Élément | Résultat et portée |
| --- | --- |
| Accès public | `https://bistrava.com/` répond. Le dépôt référence également `https://bistrava-six.vercel.app/`. |
| Catalogue publié | Les 24 références sont proposées sur le site examiné. L’exploitant confirme que les prix et stocks publiés sont ceux à utiliser pour les ventes. Aucune quantité ni aucun prix modifié pendant cette préparation. |
| Panier | Ajout d’un produit à 125,90 €, affichage du panier et accès à la commande vérifiés dans le navigateur. Panier de test vidé ensuite. |
| Livraison | Deux tarifs actifs en Slovénie, 4,50 € jusqu’à 80,00 € inclus et gratuit dès 80,01 €. Après confirmation de l’exploitant, les délais 1–3 jours ouvrés sont enregistrés et vérifiés sur les deux tarifs, sans changer montants, seuils ni activation. Préparation 1–2 jours après paiement confirmée et intégrée au contenu local. |
| Ouverture des commandes | La page de commande affiche « Sprejem naročil še ni aktiviran » et son bouton de validation est désactivé. Aucune commande réelle créée. |
| Administration | Redirection vers `/admin/connexion` sans session. Après connexion de l’exploitant, accès administrateur et réglages de paiement/livraison réels vérifiés. |
| Virement réel | L’exploitant a enregistré bénéficiaire, IBAN, banque et BIC dans `/admin/placila`. Présence des champs et confirmation d’enregistrement vérifiées ; méthode toujours désactivée. Aucune coordonnée bancaire copiée dans le code ou ce rapport. |
| Messagerie réelle | L’interface indique une synchronisation LWS réussie. Le bouton de vérification SMTP a confirmé l’authentification, sans envoi de message. Aucun contenu de la boîte mail lu ou copié pour ce contrôle. L’acheminement jusqu’à un destinataire reste à tester avec son autorisation. |
| Base isolée | `node scripts/test-promotions-db.mjs` : 24 migrations et 86 contrôles du runner réussis, ainsi que les suites SQL dédiées. Stocks, promotions, annulations, permissions, messagerie, virements et TVA de livraison testés sans écrire dans Supabase. |
| Tests applicatifs | `npm test` : 35 fichiers et 182 tests réussis, dont les régressions d’origine de la messagerie et les limiteurs bornés pour un serveur durable. |
| TypeScript et lint | `npm run typecheck` et `npm run lint` réussis. |
| Compilation de production | `npm run build` réussi, 93 pages générées. L’accès réseau aux polices Google Fonts a été nécessaire. Aucun identifiant Supabase ou e-mail de production utilisé. |
| Navigation ordinateur/mobile | 43 cas distincts validés et un cas réservé au mobile ignoré sur ordinateur. Dernier passage complet : 42 réussites et un délai de navigation dépassé au premier test administration (compilation de route à froid 5,1 s, attente 5 s). Attente d’hydratation observable et délai de navigation de 15 s ajoutés ; les cas ciblés sont vérifiés après correction. Les six cas de consentement utilisent une mesure factice et interceptent les requêtes Google. Aucun profil utilisateur utilisé. |
| Vérifications visuelles | Dix captures initiales : accueil à 360/768/1440 px, catalogue, guide de choix, fiche produit, panier et commande. Six nouvelles captures après corrections : accueil, contact et mentions à 360/1440 px, sans débordement ni erreur JavaScript. Contact mobile et mentions ordinateur inspectés visuellement. |
| Référencement publié | La page d’accueil sur `bistrava.com` annonce encore `https://bistrava-six.vercel.app` comme URL canonique. Correction locale préparée ; vérifier aussi `NEXT_PUBLIC_SITE_URL` dans Vercel avant publication. |
| Vercel | Bon projet `bistrava`, équipe `Bistrava`, dépôt affiché `Bistrava/bistrava`. Production Ready du 13 octobre, source indiquée `vercel deploy`, sans rattachement vérifié à un commit. Aucun déploiement lancé. |
| Variables Vercel | Configuration Supabase et commandes présente en Production et Preview ; mot de passe LWS présent en Production. Valeurs secrètes non révélées. Aucune variable `NEXT_PUBLIC_SITE_URL` ou de mesure Google affichée dans la liste du projet. Aucune variable modifiée. |
| Isolation de Preview | L’URL publique Supabase de Preview est identique à celle de Production. Isoler les données et identifiants avant toute création de commande de test. |
| Supabase | Accès navigateur au bon projet `Bistrava Project`, organisation `Slovenie`, Frankfurt, Healthy ; correspondance avec l’URL publique Supabase de Vercel vérifiée. Les 23 versions de migrations affichées correspondent à la base du dépôt, jusqu’à `20261013001136_payment_settings_actor_cleanup`. La correction TVA reste locale. |
| Sauvegarde | Le tableau de bord Supabase affiche « No backups ». Préparer une sauvegarde/restauration contrôlée avant toute modification du schéma de production. Aucun export de données clients réalisé. |
| GitHub | L’exploitant indique avoir reconnecté GitHub ; le connecteur de cette conversation signale encore un autre compte avec lecture seulement. Les droits propriétaire dans Chrome sont vérifiés et la publication de la branche de revue est préparée par cette voie. |
| Envoi des fichiers | L’envoi automatique est bloqué par la permission de lecture des fichiers locaux de l’extension ChatGPT. Aucun fichier envoyé. Le dossier `.tmp/upload-review` contient uniquement les 52 fichiers de revue, avec leurs chemins ; dépôt manuel de son contenu préparé dans le formulaire GitHub pour la nouvelle branche `codex/finalisation-render`. |

Les vérifications locales ont utilisé le catalogue de brouillons et aucune base distante. Elles vérifient les protections de l’environnement non configuré ; elles ne remplacent pas une commande complète avec les services Bistrava connectés.

## Corrections préparées localement

- L’URL publique par défaut devient `https://bistrava.com`, pour les liens canoniques, les métadonnées et le sitemap. Une URL locale ou Preview explicitement configurée reste respectée. Les tests reproduisaient l’ancien domaine avant la correction.
- Un échec du service d’e-mail après enregistrement d’un formulaire ne transforme plus la demande enregistrée en erreur pour le client. Les erreurs de base restent signalées et ne déclenchent aucun e-mail. Le test reproduisait le rejet de l’action avant la correction.
- Le lint ignore les caches locaux et rapports générés, conformément aux exclusions Git déjà présentes.
- Les tests navigateur correspondent au fonctionnement hors connexion actuel : produits non approuvés non achetables, aucune recommandation de brouillon, panier conservé mais commande bloquée sans contrôle des prix/stocks, administration locale en lecture seule. Les attentes sur les intitulés des nouvelles rubriques ont été actualisées. Les tests n’activent aucune vente pour contourner ces protections.
- La feuille de route reflète le virement bancaire et l’administration déjà développés, afin de ne pas recommencer une intégration existante.
- Les coordonnées de PUREH2O, Erika Kozjan, l’adresse de retour confirmée et l’absence d’organisme IRPS reconnu sont intégrées aux contenus publics. Les délais sont distincts : préparation 1–2 jours ouvrés après paiement confirmé, puis transport 1–3 jours ouvrés après expédition.
- Les avis de démonstration sont retirés de l’accueil.
- GTM/gtag attendent un choix statistique valide ; les trois consentements publicitaires restent refusés. L’ancienne autorisation ambiguë est ignorée au profit du stockage `bistrava-consent-v2`. Réouverture et retrait disponibles. Tests navigateur avec identifiant factice et requêtes Google interceptées.
- La migration `20261017172838_shipping_vat_included.sql`, créée par la CLI officielle, détaille la TVA incluse dans la livraison par taux figé. Elle conserve TTC, paiements, seuils de livraison et stocks, sans recalculer les anciennes commandes. La formule mixte reste à valider avec le comptable avant production.
- L’hébergement Node/Docker pour Render est préparé : sortie standalone, assets, utilisateur non privilégié, contrôle `/health`, Blueprint fermé à la vente et à l’indexation, compilation Linux en CI. La messagerie contrôle l’origine configurée et les compteurs anti-abus sont bornés à 5000 clés par processus. Le statut e-mail de l’administration reconnaît LWS et Resend ; l’indicateur Vercel est retiré.

Ces modifications ne sont pas encore publiées sur GitHub ni déployées. Les commandes réelles restent désactivées.

La copie locale provient de l’archive publique du commit indiqué. Le fichier `.tmp/finalisation-bistrava.patch` conserve les modifications à appliquer sur cette base. Aucun prix, stock, compte bancaire ni montant/seuil de livraison réel modifié ; seuls les délais de transport confirmés ont été enregistrés dans les deux tarifs existants.

Le dossier de revue `.tmp/bistrava-finalisation-review.zip` conserve les fichiers modifiés, le patch et leur manifeste. Les vérifications locales n’utilisent aucune connexion aux services de production ni aucun identifiant de mesure réel.

La sortie standalone compile et fonctionne sur le Node local. Contrôles HTTP réussis : `/health`, accueil, contact, Erika Kozjan dans les mentions, assets/optimisation d’images, blocage d’indexation de la revue et refus d’une origine étrangère sur la messagerie. Aperçu compilé disponible sur `http://127.0.0.1:3100/kontakt`. Docker n’est pas installé sur ce poste ; la construction Linux est prévue dans le workflow GitHub après publication de la branche, et n’est pas encore exécutée.

## Informations de l’exploitant : confirmations et éléments manquants

- Fournis et intégrés : PUREH2O, razvojni inženiring, d.o.o. (PUREH2O d.o.o.), société slovène à responsabilité limitée ; Srebrniče 18A, 8000 Novo mesto, Slovénie ; MŠ 8583056000, immatriculée le 14 janvier 2020 auprès de Okrožno sodišče Novo mesto ; DŠ 12238147 et TVA SI12238147, assujettie selon les informations de l’exploitant ; téléphone +386 40 634 639.
- Confirmés : Erika Kozjan comme représentante légale, retours à PUREH2O d.o.o., Srebrniče 18A, 8000 Novo mesto, Slovénie, et aucun organisme IRPS reconnu. La boîte `kontakt@bistrava.com` est utilisée comme contact Bistrava et confidentialité.
- Le virement bancaire est choisi et les coordonnées sont enregistrées en brouillon désactivé, sans secret dans le dépôt.
- Prix de vente et stocks publiés confirmés, préparation 1–2 jours ouvrés, livraison 1–3 jours ouvrés. Les garanties, documents et arrangements effectifs avec le transporteur restent à vérifier.

Les mentions du vendeur, l’adresse de retour et le choix IRPS sont renseignés. L’inventaire définitif des cookies et les régions/bases contractuelles des prestataires restent à finaliser avec l’hébergement effectif. La version publique actuelle utilise toujours Vercel ; les mentions seront adaptées au passage réel sur Render.

## Points techniques et opérationnels à terminer

1. Vérifier les migrations réellement appliquées et les réglages de paiement/livraison dans les bons projets.
2. L’authentification SMTP et la synchronisation LWS sont vérifiées dans l’environnement déployé. Vérifier maintenant l’acheminement avec un envoi à un destinataire de test explicitement autorisé.
3. Faire valider la politique d’allocation de TVA préparée avec le comptable, puis tester la migration dans un environnement approuvé ; voir [le parcours de paiement](payment-flow.md). Le prix de livraison affiché est déjà TTC ; aucune taxe supplémentaire ne lui est ajoutée.
4. Vérifier la commande complète en environnement de test : total recalculé, réservation du stock, confirmation, instructions de virement, doublon, annulation, réception de paiement enregistrée et suivi d’expédition.
5. Préparer le traitement des commandes impayées, retours et remboursements ainsi que les communications d’expédition et d’annulation. Aucune opération bancaire n’est exécutée par cette version.
6. Publier le retrait des exemples d’avis clients déjà préparé localement.
7. Valider les contrôles locaux, l’affichage mobile, les métadonnées, le consentement et les événements commerciaux.
8. Présenter la version Preview et les résultats pour approbation avant publication finale et activation des commandes.
9. L’exploitant choisit de préparer Render plutôt que Vercel Pro et confirme que LWS fournit seulement domaine/e-mails. Le service candidat Frankfurt coûte à partir de 7 $/mois, plus taxes/dépassements ; voir [la préparation Render](hosting-render.md). Aucun abonnement souscrit. La création du service et la bascule DNS restent à approuver sur la version vérifiée. Le choix d’hébergeur ne vaut pas autorisation d’ouverture.

## Commandes de contrôle

```powershell
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e --workers=1
pnpm visual:check
node scripts/test-promotions-db.mjs
```

Le dernier contrôle nécessite l’installation temporaire PGlite décrite dans [le guide d’administration](administration.md). Ne pas importer de secrets de production pour lancer ces contrôles isolés.
