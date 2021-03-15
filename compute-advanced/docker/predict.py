import sys
from functools import partial
import tensorflow as tf

# Read cmdline parameters. We skip error checking in this simplified example.
input_path = sys.argv[1]
output_path = sys.argv[2]

# Load the model from 'model.h5'. The model is a data dependency: The code
# assumes that the file is present in the current workdir.
top_k = tf.keras.metrics.top_k_categorical_accuracy
model = tf.keras.models.load_model(
    "./model.h5",
    custom_objects={
        'top_2_accuracy': partial(top_k, k=2),
        'top_3_accuracy': partial(top_k, k=3)
    }
)

# Load the user image.
im = tf.image.decode_jpeg(tf.io.read_file(input_path))

# Preprocess the image to match expected model input format.
im = tf.image.resize(im, [224, 224])
im = (im-127.5)/127.5

# Create a batch containing a single element: our `im`.
ims = tf.expand_dims(im, 0)

# Run the model, get predictions. yhats[0] is a vector of classification scores for
# each of the 7 output classes.
yhats = model.predict(ims)

# In a typical data-processing setting, the `yhats` array would be the final
# output. For demo purposes, we will instead output a human-readable description
# of the highest-scoring class.
max_class = tf.math.argmax(yhats[0])
LABELS = [
    'Actinic Keratoses and Intraepithelial Carcinoma',
    'Basal Cell Carcinoma',
    'Benign Keratosis',
    'Dermatofibroma',
    'Melanoma',
    'Melanocytic Nevi',
    'Vascular Lesions'
]
with open(output_path, 'w') as f:
    f.write(f"This might be an image of {LABELS[max_class]}.\n")
