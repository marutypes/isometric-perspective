import { MODULE_ID } from './main.js';
import { cartesianToIso } from './utils.js';

const ISOMETRIC_TRUE_ROTATION = Math.PI/6;

// values in degrees
export let ISOMETRIC_CONST = {
  rotation: -30.0,
  skewX:     30.0,
  skewY:      0.0
}

//convert to rad
ISOMETRIC_CONST.rotation *= Math.PI / 180;
ISOMETRIC_CONST.skewX *= Math.PI / 180;
ISOMETRIC_CONST.skewY *= Math.PI / 180;

/*
True Isometric

Planescape Torment
  rotation: -34.90,
  skewX:     19.75,
  skewY:      0.00

Fallout
  rotation: -50.9,
  skewX:      2.3,
  skewY:     36.8

Earthbound / Paperboy
  rotation:   0,
  skewX:    -45,
  skewY:      0
*/









// Função principal que muda o canvas da cena
export function applyIsometricPerspective(scene, isSceneIsometric) {
  const isometricWorldEnabled = game.settings.get(MODULE_ID, "worldIsometricFlag");
  //const isoAngle = ISOMETRIC_TRUE_ROTATION;
  //const scale = scene.getFlag(MODULE_ID, "isometricScale") ?? 1;
  
  if (isometricWorldEnabled && isSceneIsometric) {
    canvas.app.stage.rotation = ISOMETRIC_CONST.rotation;
    canvas.app.stage.skew.set(ISOMETRIC_CONST.skewX, ISOMETRIC_CONST.skewY);
    adjustAllTokensAndTilesForIsometric();
  } else {
    canvas.app.stage.rotation = 0;
    canvas.app.stage.skew.set(0, 0);
  }
}



// Função auxiliar que chama a função de transformação isométrica em todos os tokens e tiles da cena
export function adjustAllTokensAndTilesForIsometric() {
  canvas.tokens.placeables.forEach(token => applyIsometricTransformation(token, true));
  canvas.tiles.placeables.forEach(tile => applyIsometricTransformation(tile, true));
}



// Função auxiliar que chama a função de transformação isométrica em um objeto específico da cena (token ou tile)
export function applyTokenTransformation(token, isSceneIsometric) {
  applyIsometricTransformation(token, isSceneIsometric);
}



// Função que aplica a transformação isométrica para um token ou tile -------------------------------------------------
export function applyIsometricTransformation(object, isSceneIsometric) {
  const isometricWorldEnabled = game.settings.get(MODULE_ID, "worldIsometricFlag");
  //let reverseTransform = object.document.getFlag(MODULE_ID, "reverseTransform") ?? false;
  
  if (!object.mesh) {
    if (game.settings.get(MODULE_ID, "debug")) {
      console.warn("Mesh não encontrado:", object);
    }
    return;
  }


  // Flip token horizontally, if the flag is active
  let isoTileDisabled = object.document.getFlag(MODULE_ID, 'isoTileDisabled') ?? 0;
  let isoTokenDisabled = object.document.getFlag(MODULE_ID, 'isoTokenDisabled') ?? 0;
  if (isoTileDisabled || isoTokenDisabled) return

  

  if (isometricWorldEnabled && isSceneIsometric) { // && !reverseTransform
    // desfaz rotação e deformação
    object.mesh.rotation = Math.PI/4;
    object.mesh.skew.set(0, 0);
      
    // recupera as características de dimensões do objeto (token/tile)
    let texture = object.texture;
    let tileScale = object.document.texture;
    let tileHeight = object.height;
    let tileWidth = object.width;
    let originalWidth = texture.width;   // art width
    let originalHeight = texture.height; // art height
    let ratio = originalWidth / originalHeight;
    let scaleX = object.document.width;  // scale for 2x2, 3x3 tokens
    let scaleY = object.document.height; // scale for 2x2, 3x3 tokens

    // elevation info
    let elevation = object.document.elevation; // elevation from tokens and tiles
    let gridSize = canvas.scene.grid.size;
    let gridSizeRatio = gridSize / 100;
    let gridDistance = canvas.scene.grid.distance;
    let isoScale = object.document.getFlag(MODULE_ID, 'scale') ?? 1; // dynamic scale 
    /**
     * @param {Código para ser usado se quiser alterar os controles nativos do foundry}
    let origScaleX = object.document.texture.scaleX;
    let origScaleY = object.document.texture.scaleY;
    */
    
    const ElevationAdjustment = game.settings.get(MODULE_ID, "enableHeightAdjustment");
    if (!ElevationAdjustment) elevation = 0;    
    
    
    
    
    
    // Se o objeto for um Token
    if (object instanceof Token) {
      // orienta a arte para ser gerada sempre do vertice esquerdo
      /*object.mesh.anchor.set(0, 1);
      object.mesh.scale.set(
        scaleX * isoScale * gridSizeRatio,
        scaleY * isoScale * gridSizeRatio * Math.sqrt(3)
      );*/
      
      let sx = 1
      let sy = 1
      let objTxtRatio_W = object.texture.width / canvas.scene.grid.size;
      let objTxtRatio_H = object.texture.height / canvas.scene.grid.size;
      let origScaleX = object.document.texture.scaleX;
      let origScaleY = object.document.texture.scaleY;

      switch ( object.document.texture.fit ) {
        case "fill":
          sx = 1;
          sy = 1;
          break;
        case "contain":
          if (Math.max(objTxtRatio_W, objTxtRatio_H) ==  objTxtRatio_W){
            sx = 1
            sy = (objTxtRatio_H) / (objTxtRatio_W)
          }
          else{
            sx = (objTxtRatio_W) / (objTxtRatio_H)
            sy = 1
          }
          break;
        case "cover":
          if (Math.min(objTxtRatio_W, objTxtRatio_H) == objTxtRatio_W){
            sx = 1
            sy = (objTxtRatio_H) / (objTxtRatio_W)
          }
          else{
            sx = (objTxtRatio_W) / (objTxtRatio_H)
            sy = 1
          }
          break;
        case "width":
          sx = 1
          sy = (objTxtRatio_H) / (objTxtRatio_W)
          break;
        case "height":
          sx = (objTxtRatio_W) / (objTxtRatio_H)
          sy = 1
          break;
        default:
          //throw new Error(`Invalid fill type passed to ${this.constructor.name}#resize (fit=${fit}).`);
          console.warn("Invalid fill type passed to: ", object);
          sx = 1;
          sy = 1;
      }
      object.mesh.width  = Math.abs(sx * scaleX * gridSize * origScaleX * isoScale * Math.sqrt(2))
      object.mesh.height = Math.abs(sy * scaleY * gridSize * origScaleY * isoScale * Math.sqrt(2) * Math.sqrt(3))
      
      // define o offset manual para centralizar o token
      let offsetX = object.document.texture.anchorX;
      let offsetY = object.document.texture.anchorY;
      //let offsetX = object.document.getFlag(MODULE_ID, 'offsetX') ?? 0;
      //let offsetY = object.document.getFlag(MODULE_ID, 'offsetY') ?? 0;

      /**
       * @param {Código para ser usado se quiser alterar os controles nativos do foundry}
      object.mesh.scale.set(
        origScaleX * gridSizeRatio,
        origScaleY * gridSizeRatio * Math.sqrt(3)
      );
      let offsetX = object.document.texture.anchorX * 10;
      let offsetY = object.document.texture.anchorY * 10;
      */
     
      // calculo referente a elevação 
      //offsetX = offsetX + (elevation * gridSize * Math.sqrt(2) * (1/gridDistance) * (1/scaleX)); //(elevation * gridDistance * Math.sqrt(3))
      offsetX += elevation * (1/gridDistance) * 100 * Math.sqrt(2) * (1/scaleX);
      offsetX *= gridSizeRatio;
      offsetY *= gridSizeRatio;
      
      // distâncias transformadas
      const isoOffsets = cartesianToIso(offsetX, offsetY);
      
      // criar elementos gráficos de sombra e linha
      updateTokenVisuals(
        object,
        elevation,
        gridSize,
        gridDistance
      );

      // posiciona o token
      object.mesh.position.set(
        object.document.x + (isoOffsets.x * scaleX),
        object.document.y + (isoOffsets.y * scaleY)
      );
      // posiciona o token
      /*object.mesh.position.set(
        object.document.x + (object.document.width * canvas.scene.grid.size/2) + (isoOffsets.x * scaleX),
        object.document.y + (object.document.height * canvas.scene.grid.size/2) + (isoOffsets.y * scaleY)
      );*/
    }

    
    
    
    
    
    
    // Se o objeto for um Tile
    else if (object instanceof Tile) {
      //const sceneScale = canvas.scene.getFlag(MODULE_ID, "isometricScale") ?? 1;
      
      // Aplicar a escala mantendo a proporção da arte original
      object.mesh.scale.set(
        (scaleX / originalWidth) * isoScale,
        (scaleY / originalHeight) * isoScale * Math.sqrt(3)
      );
      
      // Flip token horizontally, if the flag is active
      let scaleFlip = object.document.getFlag(MODULE_ID, 'tokenFlipped') ?? 0;
      if (scaleFlip) {
        let meshScaleX = object.mesh.scale.x;
        let meshScaleY = object.mesh.scale.y;
        object.mesh.scale.set(-meshScaleX, meshScaleY);
      }

      // define o offset manual para centralizar o tile
      let offsetX = object.document.getFlag(MODULE_ID, 'offsetX') ?? 0;
      let offsetY = object.document.getFlag(MODULE_ID, 'offsetY') ?? 0;
      let isoOffsets = cartesianToIso(offsetX, offsetY);
      
      // Aplicar a posição base do tile
      object.mesh.position.set(
        object.document.x + (scaleX / 2) + isoOffsets.x,
        object.document.y + (scaleY / 2) + isoOffsets.y
      );
    }
  
  
  
  
  } else {
    // Reseta todas as transformações do mesh
    object.mesh.rotation = 0;
    object.mesh.skew.set(0, 0);
    object.mesh.scale.set(1, 1);
    object.mesh.position.set(object.document.x, object.document.y);
    object.mesh.anchor.set(0, 0);
  }
}





// Função para transformar o background da cena
export function applyBackgroundTransformation(scene, isSceneIsometric, shouldTransform) {
  if (!canvas?.primary?.background) {
    if (game.settings.get(MODULE_ID, "debug")) {
      console.warn("Background não encontrado");
    }
    return;
  }

  //console.log(scene);
  //console.log(scene); versão melhorada
  // para afetar o canvas dentro do grid configuration tool
  // modificar o canvas.stage resolve, mas ele não tem como transformar a arte
  //const background = scene.stage.background;

  const background = canvas.environment.primary.background;
  const isometricWorldEnabled = game.settings.get(MODULE_ID, "worldIsometricFlag");
  const scale = scene.getFlag(MODULE_ID, "isometricScale") ?? 1;
  
  if (isometricWorldEnabled && isSceneIsometric && shouldTransform) {
    // Aplica rotação isométrica
    background.rotation = Math.PI/4;
    background.skew.set(0, 0);
    background.anchor.set(0.5, 0.5);
    background.transform.scale.set(
      scale,
      scale * Math.sqrt(3)
    );
    
    // Calculate scene dimensions and padding
    const isoScene = canvas.scene;
    const padding = isoScene.padding;
    const paddingX = isoScene.width * padding;
    const paddingY = isoScene.height * padding;
      
    // Account for background offset settings
    const offsetX = isoScene.background.offsetX || 0;
    const offsetY = isoScene.background.offsetY || 0;
    
    // Set position considering padding and offset
    background.position.set(
      (isoScene.width / 2) + paddingX + offsetX,
      (isoScene.height / 2) + paddingY + offsetY
    );
    
    // Handle foreground if it exists
    /*if (canvas.environment.primary.foreground) {
      const foreground = canvas.environment.primary.foreground;
      foreground.anchor.set(0.5, 0.5);
      foreground.transform.scale.set(1, 1);
      foreground.transform.setFromMatrix(canvas.stage.transform.worldTransform.invert());
      foreground.position.set(
        (s.width / 2) + paddingX + (s.foreground?.offsetX || 0),
        (s.height / 2) + paddingY + (s.foreground?.offsetY || 0)
      );
    }*/

  } else {
    // Reset transformações
    background.rotation = 0;
    background.skew.set(0, 0);
    //background.transform.scale.set(1, 1);
    //background.anchor.set(0.5, 0.5);
    //background.scale.set(1, 1);
    //background.transform.position.set(canvas.scene.width/2, canvas.scene.height/2);
    
    if (game.settings.get(MODULE_ID, "debug")) {
      console.log("applyBackgroundTransformation RESET");
    }
  }
}








// ----------------- Elevation -----------------

// Manter registro de todos os containers visuais criados
const visualContainers = new Set();

// Função para limpar todos os visuais
export function clearAllVisuals() {
  for (const containerId of visualContainers) {
    const container = canvas.stage.getChildByName(containerId);
    if (container) {
      canvas.stage.removeChild(container);
    }
  }
  visualContainers.clear();
}

// Função para verificar se um token existe na cena atual
function isTokenInCurrentScene(tokenId) {
  return canvas.tokens.placeables.some(t => t.id === tokenId);
}

export function updateTokenVisuals(token, elevacao, gridSize, gridDistance) {
  // Primeiro, remova qualquer representação visual existente
  removeTokenVisuals(token);

  // Se não há elevação ou a variável global está desativada, não cria visuais
  const tokenVisuals = game.settings.get(MODULE_ID, "enableTokenVisuals");
  if (elevacao <= 0 || !tokenVisuals) return;

  // Cria um novo container
  const container = new PIXI.Container();
  container.name = `${token.id}-visuals`;
  container.interactive = false;
  container.interactiveChildren = false;
  
  // Registrar o container
  visualContainers.add(container.name);

  // Criar uma sombra circular no chão
  const shadow = new PIXI.Graphics();
  shadow.beginFill(0x000000, 0.3);
  shadow.drawCircle(0, 0, (canvas.grid.size/2) * (token.h/canvas.grid.size));
  shadow.endFill();
  shadow.position.set(
    token.x + token.h / 2, 
    token.y + token.h / 2
  );
  container.addChild(shadow);

  // Criar uma linha conectando o chão ao token
  const line = new PIXI.Graphics();
  line.lineStyle(2, 0xff0000, 0.5);
  line.moveTo(              // vai para o centro do token
    token.x + token.h / 2,
    token.y + token.h / 2
  ).lineTo(                 // desenha uma linha de onde moveu para a próxima posição
    //centraliza no token + posiciona no cartesiano diretamente, porque eu preciso somente de uma linha na diagonal
    (token.x + token.h/2) + (elevacao * (gridSize/gridDistance)),
    (token.y + token.h/2) - (elevacao * (gridSize/gridDistance))
  );
  container.addChild(line);

  // Adicionar o container ao canvas
  canvas.stage.addChild(container);
}

export function removeTokenVisuals(token) {
  const container = canvas.stage.getChildByName(`${token.id}-visuals`);
  if (container) {
    canvas.stage.removeChild(container);
    visualContainers.delete(container.name);
  }
}

Hooks.on('canvasReady', () => { 
  clearAllVisuals();
});

Hooks.on('deleteToken', (token) => {
  removeTokenVisuals(token);
});




















// ----------------- Token Configuration -----------------

// Ajusta a precisão de configurações de token no Foundry VTT
export class TokenPrecisionConfig {
  // Ajusta o incremento de Scale (Ratio) para 0.01
  static adjustScaleRatio() {
    const scaleInput = document.querySelector('input[name="scale"]');
    if (scaleInput) {
      scaleInput.step = '0.01';
      scaleInput.min = '0.1';
      console.log('Scale input adjusted', scaleInput);
    } else {
      console.warn('Scale input not found');
    }
  }

  // Ajusta o incremento de Anchor para 0.01
  static adjustAnchorIncrement() {
    // Seletores específicos para os inputs de anchor na aba Appearance
    const anchorInputSelectors = ['input[name="texture.anchorX"]', 'input[name="texture.anchorY"]'];

    let foundInputs = false;

    anchorInputSelectors.forEach(selector => {
      const inputs = document.querySelectorAll(selector);
      
      if (inputs.length > 0) {
        console.log(`Found inputs for selector: ${selector}`, inputs);
        inputs.forEach(input => {
          input.step = '0.01';
          input.min = '0';
          input.max = '1';
        });
        foundInputs = true;
      }
    });

    if (!foundInputs) {
      console.warn('No texture anchor inputs found. Token configuration might have different selectors.');
      
      // Log all inputs in the token config for debugging
      const allInputs = document.querySelectorAll('input');
      console.log('All inputs in the document:', allInputs);
    }
  }

  // Método principal para inicializar todas as configurações de precisão
  static initialize() {
    // Aguarda um breve momento para garantir que o DOM esteja carregado
    Hooks.on('renderTokenConfig', (tokenConfig, html, data) => {
      console.log('Token Config Rendered', {tokenConfig, html, data});
      
      // Pequeno delay para garantir que todos os elementos estejam prontos
      setTimeout(() => {
        this.adjustScaleRatio();
        this.adjustAnchorIncrement();
      }, 100);
    });
  }
}

// Inicializa as configurações de precisão ao carregar o módulo
TokenPrecisionConfig.initialize();




// Módulo para melhorar a interação com inputs de anchor no Foundry VTT
export class EnhancedAnchorInput {
  // Cria botões de controle e configura listeners para ajuste refinado
  static enhanceAnchorInputs(inputs) {
    // Contêiner principal para envolver os inputs e botão
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.gap = '5px';

    // Adiciona os inputs e botão
    let anchorXInput = inputs[0].cloneNode(true);
    let anchorYInput = inputs[1].cloneNode(true);

    // Configura inputs clonados
    anchorXInput.style.flexGrow = '1';
    anchorYInput.style.flexGrow = '1';
    anchorXInput.removeAttribute('min');
    anchorXInput.removeAttribute('max');
    anchorYInput.removeAttribute('min');
    anchorYInput.removeAttribute('max');

    // Criar botão de ajuste fino com ícone de 4 direções
    const adjustButton = document.createElement('button');
    adjustButton.innerHTML = '✥'; // Ícone de movimento 4 direções
    adjustButton.type = 'button';
    adjustButton.style.cursor = 'pointer';
    adjustButton.style.padding = '2px 5px';
    adjustButton.style.border = '1px solid #888';
    adjustButton.style.borderRadius = '3px';
    adjustButton.title = 'Hold and drag to fine-tune X and Y';

    // Estado do ajuste
    let isAdjusting = false;
    let startX = 0;
    let startY = 0;
    let originalValueX = 0;
    let originalValueY = 0;

    // Função para aplicar ajuste
    const applyAdjustment = (e) => {
      if (!isAdjusting) return;

      // Calcula a diferença de movimento nos eixos X e Y
      const deltaX = startX - e.clientX;
      const deltaY = startY - e.clientY;
      
      // Ajuste fino: cada 10px de movimento = 0.01 de valor
      const adjustmentX = deltaX * 0.001;
      const adjustmentY = deltaY * 0.001;
      
      // Calcula novos valores
      let newValueX = originalValueX + adjustmentX;
      let newValueY = originalValueY + adjustmentY;
      
      // Arredonda para 2 casas decimais
      newValueX = Math.round(newValueX * 100) / 100;
      newValueY = Math.round(newValueY * 100) / 100;
      
      // Atualiza os inputs de anchor
      const actualXInput = document.querySelector('input[name="texture.anchorX"]');
      const actualYInput = document.querySelector('input[name="texture.anchorY"]');

      if (actualXInput) {
        actualXInput.value = newValueX.toFixed(2);
        actualXInput.dispatchEvent(new Event('change', { bubbles: true }));
      }

      if (actualYInput) {
        actualYInput.value = newValueY.toFixed(2);
        actualYInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    };

    // Listeners para ajuste
    adjustButton.addEventListener('mousedown', (e) => {
      isAdjusting = true;
      startX = e.clientX;
      startY = e.clientY;
      
      // Obtém os valores originais dos inputs de anchor
      const actualXInput = document.querySelector('input[name="texture.anchorX"]');
      const actualYInput = document.querySelector('input[name="texture.anchorY"]');
      
      originalValueX = actualXInput ? parseFloat(actualXInput.value) : 0;
      originalValueY = actualYInput ? parseFloat(actualYInput.value) : 0;
      
      // Adiciona listeners globais
      document.addEventListener('mousemove', applyAdjustment);
      document.addEventListener('mouseup', () => {
        isAdjusting = false;
        document.removeEventListener('mousemove', applyAdjustment);
      });
      
      e.preventDefault();
    });

    // Adiciona tooltip explicativo
    adjustButton.addEventListener('mouseenter', () => {
      const tooltip = document.createElement('div');
      tooltip.textContent = 'Hold and drag to fine-tune X and Y';
      tooltip.style.position = 'absolute';
      tooltip.style.background = '#333';
      tooltip.style.color = 'white';
      tooltip.style.padding = '5px';
      tooltip.style.borderRadius = '3px';
      tooltip.style.fontSize = '12px';
      tooltip.style.zIndex = '1000';
      tooltip.style.pointerEvents = 'none';
      
      // Posiciona o tooltip
      const rect = adjustButton.getBoundingClientRect();
      tooltip.style.top = `${rect.bottom + 5}px`;
      tooltip.style.left = `${rect.left}px`;
      
      document.body.appendChild(tooltip);
      
      adjustButton.addEventListener('mouseleave', () => {
        document.body.removeChild(tooltip);
      }, { once: true });
    });

    // Adiciona os elementos ao wrapper na ordem: X input, botão, Y input
    wrapper.appendChild(anchorXInput);
    wrapper.appendChild(adjustButton);
    wrapper.appendChild(anchorYInput);

    // Substitui os inputs originais
    const parentContainer = inputs[0].parentNode;
    parentContainer.replaceChild(wrapper, inputs[0]);
    parentContainer.removeChild(inputs[1]);
  }

  // Inicializa a melhoria dos inputs de anchor
  static initialize() {
    Hooks.on('renderTokenConfig', () => {
      setTimeout(() => {
        const anchorXInput = document.querySelector('input[name="texture.anchorX"]');
        const anchorYInput = document.querySelector('input[name="texture.anchorY"]');

        if (anchorXInput && anchorYInput) {
          this.enhanceAnchorInputs([anchorXInput, anchorYInput]);
        }
      }, 100);
    });
  }
}

// Inicializa o módulo de melhoria de inputs
EnhancedAnchorInput.initialize();