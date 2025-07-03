'use client'
import Image from 'next/image';
import React, { useState } from 'react'

import Tesseract from 'tesseract.js';
import { GoogleGenAI } from '@google/genai';




const Fileupload = () => {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [extractedText, setExtractedText] = useState<string>('');
  const [loadingText, setLoadingText] = useState(false);
  const [formattedContext, setformattedContext] = useState({})
  const [formattedLoading, setformattedLoading] = useState<boolean>(false)
  const [ParsedOnes, setParsedOnes] = useState()

  const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_KEY });


  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    //resettting states for next pdf/image
     setFile(null);
  setPreviewUrl(null);
  setExtractedText('');
  setformattedContext({});
  setParsedOnes(undefined); // if you plan to use it
  setformattedLoading(false);
  setLoadingText(false);

    setFile(selected);
    const fileURL = URL.createObjectURL(selected);
    setPreviewUrl(fileURL);
    setExtractedText('');

    if (selected.type.startsWith('image/')) {
      extractTextFromImage(fileURL);
    } else if (selected.type === 'application/pdf') {
      await handlePdf(selected);
    }
  };

  const handlePdf = async (pdfFile: File) => {
    setLoadingText(true);
    const formData = new FormData();
    formData.append('file', pdfFile);

    const res = await fetch('/api/ocr', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    console.log(data, "tele")

    if (data.text) {
      setExtractedText(data.text);
      formattedData(data.text)
    } else {
      setExtractedText('Failed to extract text from PDF.');
    }

    setLoadingText(false);
  };



  const extractTextFromImage = async (imageUrl: string) => {
    setLoadingText(true);
    try {
      const result = await Tesseract.recognize(imageUrl, 'eng');
      setExtractedText(result.data.text);
      console.log('Extracted Text:', result.data.text);
      formattedData(result.data.text)


    } catch (err) {
      console.error(err);
      setExtractedText('Error extracting text.');
    } finally {
      setLoadingText(false);
    }
  };

  function parseResponse(raw: string | undefined ) {
    try {
      // Remove markdown code block syntax like ```json and ```
      const cleaned = raw?.replace(/```json|```/g, '').trim();

      // Try parsing the cleaned string
      const parsed = cleaned && JSON.parse(cleaned);

      // Ensure required structure exists
      if (!parsed.headers || !parsed.data || !parsed.insights) {
        throw new Error("Invalid format");
      }

      return parsed; // { headers, data, insights }
    } catch (error) {
      console.error("Failed to parse Gemini JSON:", error);
      return null;
    }
  }

  const formattedData = async (textcontent: string) => {
    setformattedLoading(true)
    const prompt = `
You are an intelligent health report analyzer.

Analyze the following raw lab report text and return a single JSON object with three keys:

1. **headers**: An array of strings representing the column names of the table (e.g., ["parameter", "value", "unit", "range", "interpretation"])

2. **data**: An array of objects, each representing one row of extracted data. The keys in these objects must match the headers above.

3. **insights**: A short, plain-language summary of what the data reveals about the patient. If there are abnormal values, mention them with simple suggestions (e.g., "Hemoglobin is low — might indicate anemia. Drink more iron-rich foods.") and also give short 
summary of the report that is submitted .
4. dont give headers that is object keys in two separate terms like reference ranges instead refrene_range like that so it will be easiy for mapping


Strictly return only valid JSON. Do not include markdown or explanations. 
Return ONLY valid JSON. Do not include markdown or code blocks.

Raw report text:
${textcontent}
`;



    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt
    })

    console.log(response.text?.split("```json"))

    setformattedLoading(false)
    console.log(response.text)

    setformattedContext(parseResponse(response.text))


  }

  const highlightText = (text: string, highlights: Record<string, string>) => {
    const regex = new RegExp(`(${Object.keys(highlights).join("|")})`, "gi");

    return text.split(regex).map((word, i) => {
      const key = Object.keys(highlights).find(
        (k) => k.toLowerCase() === word.toLowerCase()
      );
      return key ? (
        <span key={i} className={highlights[key]}>
          {word}
        </span>
      ) : (
        <span key={i}>{word}</span>
      );
    });
  };

  const highlights = {
    Hemoglobin: "text-red-600 font-semibold",
    "WBC count": "text-blue-600 font-semibold",
    Lymphocytes: "text-purple-600 font-semibold",
    doctor: "text-orange-600 font-semibold",
  };



  return (
    <div className='p-4 flex flex-col items-center'>

      <input ref={inputRef} onChange={handleFileChange} type="file" accept='.pdf , image/png , image/jpg , image/jpeg' className='hidden' />
      <button className='bg-primary text-white p-2 flex items-center gap-4 rounded-md' onClick={() => inputRef.current?.click()}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-file-icon lucide-file"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /></svg>

        <span>Upload Files</span>

      </button>

      {loadingText && (
        <div className="text-sm text-blue-500 mt-4">Extracting text, please wait...</div>
      )}

      {/* File preview */}
      {file && previewUrl && (
        <div className="mt-4 flex flex-col items-center justify-center">
          <p className="text-sm font-medium text-gray-600">Preview:</p>

          {file.type.startsWith('image/') ? (
            <Image
              src={previewUrl}
              alt="Uploaded Preview"
              width={250}
              height={250}

            />
          ) : file.type === 'application/pdf' ? (
            <div className='flex flex-col items-center text-center'>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="lucide lucide-file-text-icon lucide-file-text"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" /><path d="M14 2v4a2 2 0 0 0 2 2h4" /><path d="M10 9H8" /><path d="M16 13H8" /><path d="M16 17H8" /></svg>
              <p>Pdf Preview is not supported</p>
              {/* <div className="w-[250px] h-[250px] overflow-hidden border rounded">
                                <iframe
                                    src={previewUrl}
                                    className="scale-[0.3] origin-top-left w-[800px] h-[1000px]"
                                    title="PDF Preview"
                                />
                            </div> */}
            </div>

          ) : (
            <p className="text-red-500">Unsupported file type</p>
          )}
        </div>
      )}


      {/* <div className="w-[80vw] mt-12">
        <div className="-m-1.5 overflow-x-auto">
          <div className="p-1.5 min-w-full inline-block align-middle">
            <div className="border border-gray-200 overflow-hidden dark:border-neutral-700">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
                <thead>
                  <tr>
                    {
                      formattedContext?.headers?.map((head) => (<th scope="col" className="px-6 py-3 text-start text-xs font-bold uppercase text-primary">{head}</th>)
                      )
                    }

                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                  {formattedContext?.data?.map((row: any, rowIndex: number) => (
                    <tr key={rowIndex}>
                      {formattedContext.headers.map((header: string, colIndex: number) => (
                        <td
                          key={colIndex}
                          className="px-6 py-4 whitespace-nowrap text-sm font-medium "
                        >
                          {row[header] || "-"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div> */}
      <div className="w-[80vw] mt-12">
        {formattedLoading ? (
          <div className="text-blue-500 text-center py-10">Analyzing report... Please wait.</div>
        ) : formattedContext?.headers && formattedContext?.data ? (
          <div className="-m-1.5 overflow-x-auto">
            <div className="p-1.5 min-w-full inline-block align-middle">
              <div className="border border-gray-200 overflow-hidden dark:border-neutral-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-neutral-700">
                  <thead>
                    <tr>
                      {formattedContext.headers.map((head) => (
                        <th
                          key={head}
                          scope="col"
                          className="px-6 py-3 text-start text-xs font-bold uppercase text-primary"
                        >
                          {head}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                    {formattedContext.data.map((row: any, rowIndex: number) => (
                      <tr key={rowIndex}>
                        {formattedContext.headers.map((header: string, colIndex: number) => (
                          <td
                            key={colIndex}
                            className="px-6 py-4 whitespace-nowrap text-sm font-medium"
                          >
                            {row[header] || "-"}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>

      <div className='mt-2 p-12'>
        {formattedContext?.insights &&
          highlightText(formattedContext.insights, highlights)}
      </div>



    </div>
  )
} 

export default Fileupload
