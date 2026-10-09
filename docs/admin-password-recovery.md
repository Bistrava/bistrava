# Récupération du mot de passe administrateur

## Parcours de l'utilisateur

1. `/admin/connexion` propose « Mot de passe oublié ? » (`Pozabljeno geslo?`).
2. `/admin/mot-de-passe-oublie` demande un email de récupération via Supabase Auth. La réponse ne révèle pas si l'adresse possède un compte.
3. `/admin/obnovitev-gesla/potrditev` affiche une confirmation explicite. Le GET ne consomme pas le code ou le jeton ; le bouton POST vérifie la preuve auprès de Supabase puis le rôle administrateur actif.
4. `/admin/novo-geslo` permet de choisir et confirmer un mot de passe de 12 à 128 caractères. L'action valide à nouveau la session auprès d'Auth (`getUser`) et le rôle actif avant `updateUser`.
5. Après enregistrement, les sessions sont révoquées et l'utilisateur revient à la connexion. Si la révocation échoue, le message distingue le mot de passe enregistré des sessions non confirmées comme fermées ; le formulaire secret est démonté.

Les pages et messages sont disponibles en français et slovène. Aucun rôle ni compte n'est créé par ce parcours. Aucun mot de passe ou jeton n'est journalisé par l'application. Le proxy ajoute `no-store`, les pages sont `noindex` et `no-referrer`, et les outils de mesure sont exclus de `/admin`.

## Configuration Supabase indispensable

Projet : `hdgmstfqgybxdwmdsard`.

Dans **Authentication → URL Configuration** :

- Site URL : `https://bistrava-six.vercel.app`
- Redirect URLs : ajouter exactement `https://bistrava-six.vercel.app/admin/obnovitev-gesla/potrditev`

Le 9 octobre 2026, le contrôle `generateLink` renvoyait encore `http://localhost:3000` au lieu de cette destination. Une demande de correction a été adressée au propriétaire, car aucune session navigateur administrable n'était accessible. Ne pas considérer la livraison d'un email opérationnelle avant vérification de ce réglage et réception d'un email réel.

Le modèle Supabase standard utilisant `{{ .ConfirmationURL }}` est compatible avec le flux PKCE de `@supabase/ssr` : le destinataire doit ouvrir l'email dans **le navigateur où il l'a demandé**, car ce navigateur contient le vérificateur PKCE. Un code invalide, expiré ou ouvert dans un autre navigateur ramène à la demande de récupération.

Pour un lien utilisable entre navigateurs et plus résistant aux scanners d'emails, le modèle **Reset password** peut être remplacé par un lien direct basé sur `TokenHash` :

```html
<h2>Obnovitev gesla Bistrava</h2>
<p>Če ste zahtevali novo geslo, nadaljujte z obnovitvijo računa.</p>
<p><a href="{{ .SiteURL }}/admin/obnovitev-gesla/potrditev?token_hash={{ .TokenHash }}">Izberi novo geslo</a></p>
<p>Če zahteve niste poslali vi, lahko to sporočilo prezrete.</p>
```

L'action impose `type: 'recovery'` côté serveur. Le modèle personnalisé n'a pas été modifié pendant cette intervention. Le POST de Bistrava protège ce lien direct contre sa consommation par un simple GET ; le lien standard passe d'abord par un GET de vérification Supabase et ne bénéficie pas de cette protection en amont.

Sans SMTP personnalisé, Supabase limite actuellement ses emails aux membres de l'organisation et applique une faible limite horaire. Un rôle administrateur dans la boutique ne prouve pas l'éligibilité du destinataire chez Supabase. Vérifier la réception, les indésirables et la configuration SMTP avant d'étendre ce parcours à d'autres administrateurs.

Sources officielles : [mots de passe](https://supabase.com/docs/guides/auth/passwords), [PKCE](https://supabase.com/docs/guides/auth/sessions/pkce-flow), [redirections](https://supabase.com/docs/guides/auth/redirect-urls), [modèles email](https://supabase.com/docs/guides/auth/auth-email-templates), [SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

## Vérification

- Tests d'actions : refus des entrées ambiguës, absence de session, rôle inactif ou inaccessible ; redirection fixe ; type recovery imposé ; code PKCE valide/invalide ; validation du mot de passe ; refus fournisseur réessayable ; révocation des sessions et succès partiel.
- Contrôle navigateur : formulaires et états publics aux formats ordinateur/mobile, traduction, absence de débordement, métadonnées privées.
- Contrôle de session réel : génération d'une preuve de récupération pour le propriétaire, transmission uniquement en POST, validation de session et affichage du formulaire, puis révocation de la session de test. Aucun email envoyé, aucun mot de passe modifié, aucune preuve conservée dans un rapport.
- L'envoi réel et la saisie du nouveau mot de passe sont laissés au propriétaire après configuration des URL.
