import json

import re
from spacy.lang.en import English
import PyPDF2
from spacy.lang.en import English
from io import StringIO
from pdfminer.converter import TextConverter
from pdfminer.layout import LAParams
import unicodedata
import pandas as pd

import argparse
import re
import torch
import unicodedata
from allennlp.data import Vocabulary
from allennlp.modules.seq2vec_encoders import PytorchSeq2VecWrapper
from allennlp.predictors import SentenceTaggerPredictor
from tqdm import tqdm
import pandas as pd
from reproducibility_classifier_train import LSTMClassifier, ReproducibilityClaimDatasetReader


def get_document_sents_wo_pdfMiner(contents, until_references=False):
    '''
    get_document_sents_wo_pdfMiner works without pdfMiner parsing but parsed JSON object from Javascript HTTP request

    :param until_references: do we trim the reference section

    e.g. ence in HCI. ACKNOWLEDGMENTS We thank our study participants
    for their time and input into this research. Second, we acknowledge reviewers for their valuable feedback that greatly
    improved the quality of this paper. Finally, we thank Eclair Junchaya, Hy Nguyen, Rick Paz, as well as Sam Kolovson and
    Alison Kolberg for their thoughtful feedback and support. REFERENCES [1] 2018.    NSF  Definitions  of  Research  and
    Development:  An  Anno- tated Compilation of Official Sources. https://www.nsf.gov/statistics/ randdef/rd-definitions.
    pdf .  September 10 2018. [2] n.d.. /r/userexperience/. https://www.reddit.com/r/userexperi

    :return: a list of sentences
    '''

    nlp = English()  # just the language with no model
    sbd = nlp.create_pipe('sentencizer')  # or: nlp.create_pipe('sbd')
    nlp.add_pipe(sbd)
    sentences = []

    doc = nlp(str(contents))
    for sent in doc.sents:
        raw_sent = (re.sub('\s+', ' ', sent.text.replace("\n", " ")).strip())
        sentences += [raw_sent]

    total_len = len(sentences)
    print(len(sentences), "len (sentences) in this document")

    try:
        if until_references:
            for idx in range(total_len):

                # Handle line break!!
                sentences[idx] = re.sub(r"([a-zA-Z]+)- ([a-zA-Z]+)", r'\g<1>\g<2>', sentences[idx])

                if (re.search("(^|\s)REFERENCES", sentences[idx]) is not None \
                    or re.search("^acknowledg(e)*ment", sentences[idx].lower()) is not None or re.search(
                            "ACKNOWLEDG(E)*MENT", sentences[idx]) is not None) and idx > int(
                    total_len * 0.5):
                    break
            if idx == total_len - 1:
                print("[WARNING] Never encountered references!!! ")
                return sentences
            sentences = sentences[:idx]

        ### TODO: data cleaning, remove sentence of permission, page header paragraph

    except Exception as e:
        print(str(e))
        return sentences


    return sentences

def concatenateTextToDisplay(path='tmp/pagesOfTextToDisplay.json',until_references=True):
    with open(path, 'r') as infile:
        json_object = json.load(infile, )
        contents=""
        for idx, page in enumerate(json_object):
            content_in_page = " ".join([element['str'] for element in page['text']])
            contents+=content_in_page

        sentences=get_document_sents_wo_pdfMiner(contents,until_references=until_references)

    return sentences

def normalize(text, normalize=True):
    # Note: this is the best *normalization* effort we could reach at this point... after many trials and errors
    if normalize:
        text = unicodedata.normalize('NFKD', text)
    return text.replace("‘", "'").replace("’", "'").replace("“", "\"").replace("”", "\"").replace("\n", " ").replace(
        "\t", " "). \
        encode('utf-8', errors="ignore").decode('utf-8', errors="ignore").strip("-")

def raw_pdf_to_csv(pdf_in_path, csv_tmp_path):
    '''
    This function is adapted from ../data/prepare-reproducibility-corpus.py
    PDFMiner and spacy parses a PDF into sentences, saves to csv_out_path
    '''

    # def remove_ligature(sent):  # maybe normalize by NFKD???
    #     return sent.replace('ﬁ', 'fi').replace('ﬂ', 'fl')

    sents = concatenateTextToDisplay(pdf_in_path,until_references=True)

    # TODO: consider change get_document_sents from textToDisplay too!!!

    if sents == None:
        raise Exception("sents are None!")

    sents_csv_entry = []

    # Adapted from reproducibility_matcher.py output_all_sents()
    for sent_pos, sent in enumerate(sents):
        normalized_text = normalize(sent, normalize=True)
        sents_csv_entry.append({"sent_id": str(pdf_in_path.split("/")[-1]) + "_" + str(sent_pos),
                                "text": normalized_text
                                })
    df = pd.DataFrame(sents_csv_entry)
    df.to_csv(csv_tmp_path, columns=['sent_id', 'text', 'label'])
    return

def inference(in_path):
    print("Inside inference")
    parser = argparse.ArgumentParser(description='Input, output and other configurations')
    # parser.add_argument('--pdf_dir', type=str, default="tmp/")
    parser.add_argument('--embedding_dim', type=int, default=100)  # 100 for glove; 128 if not glove
    parser.add_argument('--hidden_dim', type=int, default=128)

    parser.add_argument('--model_path', type=str, default="model/model.th")  # pre-trained models
    parser.add_argument('--vocab_path', type=str,
                        default="model/vocab.th")  # vocabulary mapping (bundled w/ pre-trained models)
    parser.add_argument('--embedding_path', type=str,
                        default="model/embedding.th")  # again, bundled w/ pre-trained models

    parser.add_argument('--topn', type=int, default=10)
    parser.add_argument('--threshold', type=float, default=0.3)

    args = parser.parse_args()


    csv_tmp_path = in_path.replace(".json", ".csv")
    csv_out_path = in_path.replace(".json", ".scored.csv")
    raw_pdf_to_csv(in_path,csv_tmp_path)

    print("raw_pdf_to_csv finished!")

    lstm = PytorchSeq2VecWrapper(torch.nn.LSTM(args.embedding_dim, args.hidden_dim, batch_first=True))
    vocab = Vocabulary.from_files(args.vocab_path)
    word_embeddings = torch.load(open(args.embedding_path, "rb"))
    model = LSTMClassifier(word_embeddings, lstm, vocab)
    with open(args.model_path, 'rb') as f:
        model.load_state_dict(torch.load(f))

    sents = []
    delimiter = ".json_"

    reader = ReproducibilityClaimDatasetReader()
    reader.switch_to_test()
    test_dataset = reader.read(csv_tmp_path)

    # for line in open(args.csv_test_path)
    predictor = SentenceTaggerPredictor(model,
                                        dataset_reader=reader)  # SentenceTagger shares the same logic as sentence classification predictor
    for instance in tqdm(test_dataset):  # Loop over every single instance on test_dataset

        prediction = predictor.predict_instance(instance)
        softmax = prediction['softmax']

        pos_label_idx = vocab.get_token_index("2",
                                              "labels")
        pos_score = softmax[pos_label_idx]
        sents.append({"paperID": instance.fields['metadata']['sent_id'].split(delimiter)[0], "sent_pos": int(
            instance.fields['metadata']['sent_id'].split(delimiter)[1]), "text": instance.fields['tokens'].get_text(),
                      "pos_score": float(pos_score)})

    # write output into a .csv file. Takes about 2 mins
    df = pd.DataFrame(sents)

    # TODO: change the sort_values criteria when we generate the eval plot
    # df = df.sort_values(by=['paperID', 'pos_score'], ascending=False)
    df = df.sort_values(by=['pos_score'], ascending=False)

    mask = (df['text'].str.len() > 10)
    df = df.loc[mask]

    df.to_csv(csv_out_path)

    '''
    
    Next, assemble the two JSON files to support *fuzzy string match,* and output in below format
    
    meta => metadata in the pdf
    outline => section names in the pdf
    textToDisplay => what pdfs store but converted to json objects (you want this)
    
    ========================
    metadataToHighlight.json format (all page union)
    
    {
        "note":"Below are a list of (key, value) for metadata. \
                Each key is the metadata type, the value is a list of \
                top-scored sentences for that metadata type. \
                These sentences were parsed and concatenated with an external tool (spacy). ",
        "participant_detail":[   // one type of metadata type
        {"text":"This participant has 10 teeth".  // the sentence
        "score": 0.9999                           // the likelihood/score
        },
    
        {"text":"This participant has 5 teeth".
        "score": 0.9595
        },
    
        ]
    }
    
    ========================
    metadataToHighlight-page000X.json   // mapped to corresponding fields in textToDisplay-page000X.json (id, str, etc.)
    
    {
      "pageNumber": 1,
      "metadataToHighlight": [
        {"id": "0001-0000",
        "substr_tohighlight": "Extracting Scientific Figures", //Sometimes, the text span goes across two sentences and we only \
                                                    want to highlight one of them...That's why we have substr here.
        "str": "Extracting Scientific Figures with",
        }
      ]
    }
    
    '''

    import json

    # with open(args.pdf_dir + "metadataToHighlight.json", "w") as fout:
    metadataToHighlight = dict()
    metadataToHighlight['note'] = "Below are a list of (key, value) for metadata. \
    Each key is the metadata type, the value is a list of \
    top-scored sentences for that metadata type. \
    These sentences were parsed and concatenated with an external tool (spacy). "
    participant_detail = list()
    top_10_text = list()
    for idx, row in df.head(n=args.topn).iterrows():  # we take topn sentences for participant_detail
        score = float(row['pos_score'])
        if score < args.threshold:  # if below threshold, we discard
            continue
        participant_detail += [{
            "text": row['text'],
            "score": score,
        }]
        top_10_text += [row['text']]
    metadataToHighlight['participant_detail'] = participant_detail
        # json.dump(metadataToHighlight, fout, indent=4)

    print("top_10_text are", top_10_text)
    return metadataToHighlight


if __name__ == "__main__":
    # sentences=concatenateTextToDisplay()
    # print(sentences)
    inference("tmp/pagesOfTextToDisplay.json")