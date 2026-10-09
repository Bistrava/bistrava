# Livraison Bistrava — comparaison et décision du 9 octobre 2026

## Périmètre de la recherche

Consultation des sites officiels de GGV, EKOM, Vodni Filtri et Tehnofan / filtri-za-vodo.si, cités par le propriétaire du projet. Ces observations ne démontrent ni leur part de marché, ni une position de leader. Elles portent sur leurs conditions publiques de vente au détail, pas sur les coûts qu’un transporteur facturera à Bistrava.

### Vodni Filtri — référence retenue pour le tarif

- Le site annonce **4,50 € TTC** de livraison et la gratuité pour une commande **supérieure à 80 €**.
- La page affiche aussi un forfait de 20 € hors Slovénie et prévoit le prépaiement des articles sur commande. Le paiement à réception est mentionné, sans supplément chiffré confirmé.
- Aucune exception de poids ou de palette n’a été trouvée sur les deux pages examinées. Cela ne prouve pas qu’une palette coûte autant qu’un petit colis à expédier.

Source : [Dostava in plačila](https://vodni-filtri.si/dostava-in-placila/), consultation du 09/10/2026. Contenu confirmé par lecture directe pendant la recherche ; certaines tentatives d’ouverture via l’outil web ont rencontré une vérification antibot.

Les conditions générales annoncent 3 à 7 jours ouvrés pour le stock à compter de la confirmation, avec traitement le jour même avant midi et le prochain jour ouvré sinon. Les articles sur commande sont annoncés à 7 à 14 jours après prépaiement, sans précision « jours ouvrés » dans le passage consulté. Un adoucisseur ATLAS Roma affiche pour sa part un délai fournisseur à demander : le délai générique ne doit donc pas être étendu à toutes les références.

Sources : [Conditions générales Vodni Filtri](https://vodni-filtri.si/splosni-pogoji-poslovanja/) ; [Adoucisseur ATLAS Roma](https://vodni-filtri.si/izdelek/mehcalna-naprava-atlas-roma-1-25/), consultation du 09/10/2026.

### Tehnofan / filtri-za-vodo.si

Le pied de page officiel annonce la livraison gratuite pour les achats en ligne **au-dessus de 150 €**. Le forfait sous ce seuil, les délais, le contre-remboursement et les exceptions n’ont pas été confirmés. L’accès au PDF officiel a rencontré une vérification antibot. Aucun tarif provenant de tehnofan.hr, destiné au marché croate, n’a été repris pour la Slovénie.

Source : [Conditions générales Tehnofan](https://filtri-za-vodo.si/pogoji-poslovanja/), consultation du 09/10/2026, section « Brezplačna dostava » du pied de page.

### GGV

Les CGV indiquent que le coût de livraison est affiché à la finalisation de l’achat, avec un délai habituel de **3 à 5 jours ouvrés**. Aucun forfait TTC ni seuil de gratuité public n’a été confirmé. Elles listent les cartes via Stripe et le virement sur facture pro forma ; le contre-remboursement n’est pas documenté dans cette page.

Source : [Conditions générales GGV](https://ggv.si/splosni-pogoji-poslovanja/), consultation du 09/10/2026.

Le sel de 25 kg est explicitement proposé **sans livraison, avec retrait à Vrhnika uniquement**. Certaines offres d’adoucisseurs comprenant l’installation incluent un trajet maximal de **200 km aller-retour depuis Vrhnika** ; le supplément kilométrique n’est pas chiffré dans les fiches examinées. Ces prestations ne constituent pas un tarif standard de transport de colis.

Sources : [Sel 25 kg](https://ggv.si/izdelek/tabletirana-sol-25-kg/) ; [Pack Midnight 12 avec installation](https://ggv.si/izdelek/komplet-mn12/) ; [Pack Elba 12 avec installation](https://ggv.si/izdelek/komplet-el-12/), consultation du 09/10/2026. Certaines fiches ont été lues via leur contenu officiel indexé lorsque l’ouverture directe expirait ou présentait une vérification antibot.

### EKOM

Les pages consultées présentent un catalogue technique et orientent vers une demande de devis. Aucun tarif TTC de transport, seuil gratuit, délai standard, barème de poids ou condition de contre-remboursement n’a été trouvé. La page de conditions retrouvée porte principalement sur l’utilisation du site et les cookies. Les informations manquantes restent inconnues.

Sources : [Catalogue des adoucisseurs EKOM](https://ekom.si/mehcalne-naprave/) ; [Contact EKOM](https://ekom.si/o-nas/) ; [Conditions et cookies](https://ekom.si/splosni-pogoji-in-piskotki/), consultation du 09/10/2026.

## Décision commerciale Bistrava

Le montant et le seuil de Vodni Filtri servent de référence. La règle **avant code promotionnel** est une décision explicite pour Bistrava ; la recherche ne permet pas d’affirmer que les concurrents calculent leurs seuils de la même manière.

| Destination | Valeur des produits TTC, avant code promotionnel | Livraison TTC |
|---|---:|---:|
| Slovénie (`SI`) | Jusqu’à **80,00 € inclus** | **4,50 €** |
| Slovénie (`SI`) | **Strictement plus de 80,00 €**, soit dès **80,01 €** | **Gratuite** |

La base du seuil est la somme des **prix de vente TTC × quantités**, y compris les éventuelles réductions déjà intégrées au prix du produit. Le coût de transport et la réduction supplémentaire d’un code promotionnel ne modifient pas cette base.

Bornes en base de données : tarif payant à `price_cents = 450`, minimum absent ou zéro et `max_order_cents = 8000` ; tarif gratuit à `price_cents = 0`, `min_order_cents = 8001` et maximum absent. Les bornes sont inclusives. Il n’y a donc ni chevauchement ni intervalle non couvert à 80 €.

Exemples : 79,99 € → 4,50 € ; 80,00 € → 4,50 € ; 80,01 € → 0 €. Un panier de produits à 90 € bénéficiant ensuite d’un code de 20 € conserve la livraison gratuite. Un panier de produits à 80 € reste soumis aux 4,50 € de livraison.

Le prix de livraison est affiché avant la commande. Aucun supplément de poids, de palette ou d’adresse slovène ne sera ajouté après la commande. Aucun forfait étranger ni nouveau mode de contre-remboursement n’est activé par cette décision.

## Publication et points restant à finaliser

- `/dostava` lit les tarifs actifs de Slovénie via `getActiveShippingRates()` ; le tableau public suit les changements effectués ensuite dans l’administration. Le prix et le seuil ne sont pas dupliqués dans le texte statique.
- Si les tarifs sont indisponibles, la page le signale sans inventer un forfait ou une gratuité.
- **Pošta Slovenije retenue comme transporteur prévu ; contrat et délais opérationnels à finaliser.** Voir la [recherche et la page Livraison](delivery-carrier-2026-10-09.md). Les délais estimés des nouveaux tarifs restent `NULL` et les fiches n'affichent pas encore de délai de réception. La page invite à demander la date prévisionnelle ; les délais des concurrents ne deviennent pas ceux de Bistrava.
- Les coûts réels des colis lourds doivent être vérifiés dans le futur contrat transporteur avant l’ouverture des commandes. Les conditions publiques ne prévoient pas de majoration tardive pour compenser un coût imprévu.
- **La prise de commande et le paiement restent désactivés** à cette étape (`CHECKOUT_ORDERING_ENABLED=false`). Configurer la livraison ne vaut pas activation des ventes ou d’un prestataire de paiement.
- Les pages de retours, garanties et autres conditions juridiques ne sont pas modifiées par cette intervention.
