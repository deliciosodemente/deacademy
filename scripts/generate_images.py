import base64 
import mimetypes 
import os 
from google import genai 
from google.genai import types 

def save_binary_file(file_name, data): 
    f = open(file_name, "wb") 
    f.write(data) 
    f.close() 
    print(f"Archivo guardado en: {file_name}") 

def generate_academy_images(): 
    client = genai.Client( 
        api_key=os.environ.get("GEMINI_API_KEY"), 
    ) 

    model = "gemini-2.5-flash-image-preview" 
    
    # Lista de imágenes a generar con sus prompts
    image_prompts = [
        {
            "name": "hero_image",
            "prompt": "Una imagen moderna y profesional que represente el aprendizaje del inglés online. Muestra una interfaz de computadora con elementos de estudio de idiomas, notas y una videollamada en curso. Estilo minimalista y corporativo."
        },
        {
            "name": "community_banner",
            "prompt": "Un banner que represente una comunidad diversa de estudiantes de inglés interactuando online. Muestra avatares o perfiles conectados, símbolos de chat y elementos que representen la práctica del idioma. Estilo moderno y acogedor."
        },
        {
            "name": "profile_header",
            "prompt": "Una imagen abstracta y profesional para el encabezado de perfil de usuario. Combina elementos que representen el progreso en el aprendizaje del inglés, como gráficos, insignias y elementos de gamificación. Estilo limpio y motivador."
        }
    ]

    for image_config in image_prompts:
        contents = [ 
            types.Content( 
                role="user", 
                parts=[ 
                    types.Part.from_text(text=image_config["prompt"]), 
                ], 
            ), 
        ] 
        
        generate_content_config = types.GenerateContentConfig( 
            response_modalities=[ 
                "IMAGE", 
                "TEXT", 
            ], 
        ) 

        file_index = 0
        for chunk in client.models.generate_content_stream( 
            model=model, 
            contents=contents, 
            config=generate_content_config, 
        ): 
            if ( 
                chunk.candidates is None 
                or chunk.candidates[0].content is None 
                or chunk.candidates[0].content.parts is None 
            ): 
                continue 
            if chunk.candidates[0].content.parts[0].inline_data and chunk.candidates[0].content.parts[0].inline_data.data: 
                file_name = f"public/images/{image_config['name']}" 
                inline_data = chunk.candidates[0].content.parts[0].inline_data 
                data_buffer = inline_data.data 
                file_extension = mimetypes.guess_extension(inline_data.mime_type) 
                save_binary_file(f"{file_name}{file_extension}", data_buffer) 
            else: 
                print(chunk.text) 

if __name__ == "__main__": 
    # Crear directorio de imágenes si no existe
    os.makedirs("public/images", exist_ok=True)
    generate_academy_images()