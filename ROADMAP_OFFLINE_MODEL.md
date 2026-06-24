# KOOBO — Plan d'entraînement du modèle de détection HORS-LIGNE

Objectif : un modèle léger de détection de maladies des plantes qui tourne
**dans le navigateur du téléphone, sans internet ni quota IA** (à la PlantVillage
Nuru). Diagnostic instantané, gratuit, même en zone non couverte.

---

## 1. Vue d'ensemble
| Étape | Outil | Sortie |
|------|-------|--------|
| Données | Datasets ouverts | images étiquetées par classe |
| Entraînement | Python + TensorFlow/Keras (transfer learning) | modèle entraîné |
| Conversion | TensorFlow.js (ou ONNX) | modèle web (~5–15 Mo) |
| Intégration | React + `@tensorflow/tfjs` (ou `onnxruntime-web`) | inférence dans le navigateur |
| Hors-ligne | PWA (service worker) | modèle mis en cache, dispo sans réseau |

> Coût : **0 €** (datasets et outils gratuits). Entraînement possible sur
> **Google Colab gratuit (GPU)**.

---

## 2. Données
- **PlantVillage** (~54 000 images, 38 classes feuilles saines/malades) — référence.
- **Cassava Leaf Disease** (Kaggle, ~21 000 images) — pertinent en Afrique.
- **Maize/Corn disease** (PlantVillage + jeux dédiés) — prioritaire au Sahel.
- *(Idéal STIC'26 : ajouter quelques centaines de photos prises localement au Burkina pour la robustesse terrain.)*

Préparation : redimensionner en 224×224, split **80/10/10** (train/val/test),
**augmentation** (rotation, flip, luminosité, zoom) pour simuler les conditions réelles.

---

## 3. Entraînement (transfer learning)
Base recommandée : **MobileNetV3-Small** ou **EfficientNet-Lite0** (légers, rapides,
adaptés au mobile). Squelette :

```python
import tensorflow as tf
IMG=224; BATCH=32
train = tf.keras.utils.image_dataset_from_directory("data/train", image_size=(IMG,IMG), batch_size=BATCH)
val   = tf.keras.utils.image_dataset_from_directory("data/val",   image_size=(IMG,IMG), batch_size=BATCH)
classes = train.class_names

aug = tf.keras.Sequential([
  tf.keras.layers.RandomFlip("horizontal"),
  tf.keras.layers.RandomRotation(0.15),
  tf.keras.layers.RandomZoom(0.15),
  tf.keras.layers.RandomBrightness(0.2),
])
base = tf.keras.applications.MobileNetV3Small(input_shape=(IMG,IMG,3), include_top=False, weights="imagenet")
base.trainable = False  # phase 1 : on gèle la base

x = tf.keras.Input((IMG,IMG,3))
y = aug(x)
y = tf.keras.applications.mobilenet_v3.preprocess_input(y)
y = base(y, training=False)
y = tf.keras.layers.GlobalAveragePooling2D()(y)
y = tf.keras.layers.Dropout(0.3)(y)
y = tf.keras.layers.Dense(len(classes), activation="softmax")(y)
model = tf.keras.Model(x, y)
model.compile(optimizer="adam", loss="sparse_categorical_crossentropy", metrics=["accuracy"])
model.fit(train, validation_data=val, epochs=10)

# phase 2 (fine-tuning) : dégeler les dernières couches, lr faible
base.trainable = True
model.compile(optimizer=tf.keras.optimizers.Adam(1e-5), loss="sparse_categorical_crossentropy", metrics=["accuracy"])
model.fit(train, validation_data=val, epochs=5)
model.save("koobo_disease.keras")
```
Cible de performance : **> 90 % de précision** sur le test (atteignable avec PlantVillage).

---

## 4. Conversion pour le web
**Option A — TensorFlow.js** (recommandé, simple en React) :
```bash
pip install tensorflowjs
tensorflowjs_converter --input_format=keras koobo_disease.keras web/public/model
# génère web/public/model/model.json + *.bin  (+ enregistrer classes.json)
```
**Option B — ONNX** (`tf2onnx` → `onnxruntime-web`) si tu préfères ONNX.

---

## 5. Intégration dans l'app (React)
```bash
npm i @tensorflow/tfjs
```
```ts
import * as tf from "@tensorflow/tfjs";
let model: tf.GraphModel | null = null;
const CLASSES: string[] = await fetch("/model/classes.json").then(r => r.json());

export async function loadModel() {
  if (!model) model = await tf.loadGraphModel("/model/model.json"); // mis en cache par le SW
  return model;
}
export async function predict(imgEl: HTMLImageElement) {
  const m = await loadModel();
  const t = tf.browser.fromPixels(imgEl).resizeBilinear([224,224]).toFloat().expandDims(0);
  const out = (await (m.predict(t) as tf.Tensor).data());
  const i = out.indexOf(Math.max(...out));
  return { label: CLASSES[i], confidence: out[i] };
}
```
Dans la page **Détection** : ajouter un onglet « Hors-ligne » qui utilise `predict()`
au lieu de l'API. (On peut garder l'API en ligne pour le détail causes/traitement.)

---

## 6. Mode hors-ligne (PWA)
Mettre le modèle en cache dans le service worker (`web/public/sw.js`) :
```js
const ASSETS = ["/model/model.json", "/model/classes.json" /* + fichiers .bin */];
// pré-cache à l'install → diagnostic possible sans réseau.
```

---

## 7. Évaluation & itération
- Matrice de confusion sur le test, précision par classe.
- Tester sur de **vraies photos terrain** (téléphone, lumière variable).
- Réentraîner avec les images mal classées (boucle d'amélioration).

## 8. Estimation d'effort
| Tâche | Durée indicative |
|------|------------------|
| Préparer les données | 0,5 – 1 jour |
| Entraîner (Colab GPU) | 0,5 – 1 jour |
| Convertir + intégrer React | 0,5 – 1 jour |
| Mode hors-ligne + tests | 0,5 jour |
| **Total** | **~3 jours** |

---

## 9. Argument STIC'26
La détection **hors-ligne sur l'appareil** est un différenciateur majeur :
- fonctionne **sans connexion** (réalité rurale) et **sans coût d'API** ;
- diagnostic **instantané** ;
- protège la **vie privée** (les images ne quittent pas le téléphone).
À présenter comme la **phase 2** de KOOBO (la phase 1 — l'app en ligne — est déjà déployée).
