FROM tensorflow/tensorflow:2.4.1

# Prepare work directory.
RUN mkdir /acme_skin
WORKDIR /acme_skin

# Add the ML model. The `model.h5` file we need is inside a zip.
RUN apt -qq update \
    && apt -qq install unzip \
    && curl -sL https://github.com/uyxela/Skin-Lesion-Classifier/raw/3ca96c925cc140e6391d5cdfeb1e1ab026ee670f/model.zip > model.zip \
    && unzip model.zip \
    && rm model.zip

# Add our python script.
COPY predict.py .

# The prescribed way to use this image is to invoke predict.py with arbitrary parameters.
ENTRYPOINT ["python", "predict.py"]
