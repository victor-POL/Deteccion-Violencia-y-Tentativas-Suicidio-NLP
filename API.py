# ---------------------------------------------------------------------------- #
#                              Requisitos Previos                              #
# ---------------------------------------------------------------------------- #

import joblib
import nltk
nltk.download('stopwords')
nltk.download('punkt')
nltk.download('averaged_perceptron_tagger')
nltk.download('wordnet')
# from googletrans import Translator

from flask import request, jsonify, Flask
from pyngrok import ngrok, conf
import getpass
import threading

# Funcion axuiliar para saber si estoy en el collab y usar su path o el del proyecto de github
def is_running_on_colab():
    try:
        import google.colab
        return True
    except ImportError:
        return False
    
from enum import Enum
# Funcion auxiliar para luego entrenar varios modelos con una sola ejecucion
class Modelos(Enum):
    LOGISTIC_REGRESSION = 'logistic_regression'
    DECISION_TREE = 'decision_tree'
    MULTINOMIAL = 'multinomial'
    BERNOULLI = 'bernoulli'
    GAUSIAN = 'gausian'




# ---------------------------------------------------------------------------- #
#                           Funcion procesador texto                           #
# ---------------------------------------------------------------------------- #

import neattext.functions as nfx
from nltk import pos_tag, word_tokenize
from nltk.stem import WordNetLemmatizer
from nltk.corpus import stopwords
from string import punctuation
import emoji

wnl = WordNetLemmatizer()

def penn2morphy(penntag):
    """ Converts Penn Treebank tags to WordNet. """
    morphy_tag = {'NN':'n', 'JJ':'a',
                  'VB':'v', 'RB':'r'}
    try:
        return morphy_tag[penntag[:2]]
    except:
        return 'n'


stopwords_en = stopwords.words('english')
stopwords_en = set(stopwords_en).union(set(punctuation))

my_custom_stopwords = {'’', "n't", "'m", "'s", "'ve", '...', 'ca', "''", '``', '\u200d', 'im', 'na', "'ll", '..', 'u', "'re", "'d", '--', '”', '“', '\u200f\u200f\u200e', '....', 'ㅤ','\u200e\u200f\u200f\u200e', 'x200b', 'ive', '.-', '\u200e', '‘'}

stopwords_en = stopwords_en.union(my_custom_stopwords)


def preprocessing_function(text):
    words = []

    for word, tag in pos_tag(word_tokenize(nfx.clean_text(text))):
        word_lemmatized = wnl.lemmatize(word.lower(), pos=penn2morphy(tag))

        if '\u200b' in word_lemmatized:
            continue

        if word_lemmatized not in stopwords_en and not word_lemmatized.isdigit() and not emoji.purely_emoji(word_lemmatized):
            words.append(word_lemmatized)

    return words





# ---------------------------------------------------------------------------- #
#                            Carga modelo entrenado                            #
# ---------------------------------------------------------------------------- #

# MODIFICAR ESTOS PARAMETROS PARA LA CARGA
# --------------------------------------------------------
nombre_modelo_prev_entrenado = Modelos.LOGISTIC_REGRESSION.value
# usar formato '25k' para 25.000 filas ejemplo
cant_prev_entrenada = '50k'

path_base_modelo_generado = '/content/' if is_running_on_colab() else '.\\tentativa_suicidio\\entrenados\\'
path_modelo_generado = path_base_modelo_generado + nombre_modelo_prev_entrenado + '_' + cant_prev_entrenada
# --------------------------------------------------------

model = joblib.load(path_modelo_generado + '_model.pkl')
vect = joblib.load(path_modelo_generado + '_vector.pkl')

print(type(vect))
print(type(model))





# ---------------------------------------------------------------------------- #
#                                Funcion predict                               #
# ---------------------------------------------------------------------------- #

# translator = Translator()

def get_tentativa_suicidio(text_input, english_text=False):
    texto_a_analizar = text_input #if english_text else translator.translate(text_input, dest='en').text
        
    texto_preprocesado = ' '.join(preprocessing_function(texto_a_analizar))
    texto_vectorizado = vect.transform([texto_preprocesado])

    return bool(model.predict(texto_vectorizado)[0])




# ---------------------------------------------------------------------------- #
#                               Detener servidor                               #
# ---------------------------------------------------------------------------- #

import signal
import sys

def handle_sigint(sig, frame):
    print("Deteniendo el servidor Flask...")
    sys.exit(0)

signal.signal(signal.SIGINT, handle_sigint)





# ---------------------------------------------------------------------------- #
#                         Funcion obtener texto de url                         #
# ---------------------------------------------------------------------------- #

from selenium import webdriver
from selenium.webdriver.common.by import By
import time
import re

def get_texto(url):
    options = webdriver.FirefoxOptions()
    options.add_argument('--headless')
    driver = webdriver.Firefox(options=options)
    driver.get(url)

    texto = ""
    hay_read_more = False
    time.sleep(1)

    try:
        buttons = driver.find_elements(By.XPATH, "//button[contains(@id, '-read-more-button')]") 
        for button in buttons:
            if re.search(r"-read-more-button$", button.get_attribute("id")):
                if button.is_displayed():
                    hay_read_more = True
                    button.click()
                    break
        if(hay_read_more):
            button_id = button.get_attribute("id")
            div_id_pattern = re.sub(r"-read-more-button$", "-post-rtjson-content", button_id)
            texto_element = driver.find_element(By.XPATH, f"//div[contains(@id, '{div_id_pattern}')]")
        else:
            parent_div = driver.find_element(By.XPATH, "//div[@class='text-neutral-content']")
            texto_element = parent_div.find_element(By.XPATH, ".//div[contains(@id, '-post-rtjson-content')]")
            
        texto = texto_element.text
    finally:
        driver.close()


    return texto






# ---------------------------------------------------------------------------- #
#                                      API                                     #
# ---------------------------------------------------------------------------- #

from flask_cors import CORS

app = Flask(__name__)

CORS(app)

@app.route("/")
def home():
    return "<p>API para predecir tentativas de suicidio en textos.</p>"

@app.route('/test', methods=['GET'])
def test():
    return jsonify({"message": "Funciona"})


@app.route('/text_prediction', methods=['GET'])
def procesar_texto_get():
    texto = request.args.get('text')
    if texto:
        print(f"Texto recibido: '{texto}'")
        texto = texto.strip()
        if(texto.isspace() or texto == ""):
            return jsonify({"error": "No se pudo procesar el texto ya que esta vacío"})
        prediction = get_tentativa_suicidio(texto)
        print(f"Prediccion: '{prediction}'")
        return jsonify({"prediction": prediction})
    else:
        return jsonify({"error": "No se proporció un texto en la solicitud"})
    
@app.route("/text_prediction", methods=["POST"])
def procesar_texto_post():
    data = request.json
    texto = data.get("texto")
    if texto:
        print(f"Texto recibido: '{texto}'")
        texto = texto.strip()
        if(texto.isspace() or texto == ""):
            return jsonify({"error": "No se pudo procesar el texto ya que esta vacío"})
        prediction = get_tentativa_suicidio(texto)
        print(f"Prediccion: '{prediction}'")
        return jsonify({"prediction": prediction})
    else:
        return jsonify({"error": "No se proporcionó un texto en la solicitud"})
    
@app.route("/url_prediction", methods=["POST"])
def procesar_url_post():
    data = request.json
    url = data.get("url")
    if url:
        print(f"URL Recibida: '{url}'")
        texto = get_texto(url)
        print(f"Texto obtenido: '{texto}'")
        prediction = get_tentativa_suicidio(texto)
        print(f"Prediccion: '{prediction}'")
        return jsonify({"prediction": prediction})
    else:
        return jsonify({"error": "No se proporcionó la URL en la solicitud"})

if __name__ == '__main__':
    app.run()


# Llama a la función de inicio del servidor Flask
if __name__ == '__main__':
    app.run()