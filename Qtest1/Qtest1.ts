/// <reference path="./../../../dts/globalTypesAndInterfaces.d.ts"/>
/// <reference path="./../../../dts/swe.d.ts"/>
import {ActorAttrs, GameContent_Instance, AttackModelOptions, Ability_Buff, Ability_Summon, Actor_Block} from "./../../../dts/swe"; // can only be used for TypeScript typing annotation
import { PuzzleModel } from "./model";
const {RcAPI, CST, CSTF, Tk, Geo, Ds, RngGen} = RC;

/*
TODO add dialogue that explains the rules, +maybe a npc in the puzzle room that can explain the rules/give a hint?
*/

enum VAR {talkNpc, gameStarted}
enum ITEM {}
enum NPC {npc, tile, lock, submit, doStep}
enum TAG {tileType, tilePosX, tilePosY, tilePos, locked}
enum CHALLENGE {}
enum LABEL {}
enum ABILITY {}
enum PRESET {}
enum MAP {QfirstTown_main,main,map1}
enum DIALOGUE {Ringo_intro}
enum PATH {}

const API = RcAPI.newAPI<VAR,ITEM,NPC,TAG,CHALLENGE,LABEL,ABILITY,PRESET,MAP,DIALOGUE,PATH,DEFAULT_VAR>(VAR,ITEM,NPC,TAG,CHALLENGE,LABEL,ABILITY,PRESET,MAP,DIALOGUE,PATH);

const pack = API.newQuest({
  name:"Qtest1",
  description:"The greatest quest ever.",
  author:"Your Name!",
  maxPartySize:8,
  recommendedPartySize:1,
  lvlMatters:false,
  allowJoinOngoingQuest:true,
  failureOnSignIn:true,

  // reward:{completionDuration:0.4,monster:0},
  // requirement:{"gameContentComplete":[CST.GC.Qminesweeper]},
  // zone:CST.ZONE.QnorthMountains,
});
// @ts-ignore
const {s,m,n,d,a,gc,S} = pack;

class DEFAULT_VAR {
  [VAR.talkNpc] = false;
  [VAR.gameStarted] = false;
}
n.newVariable(new DEFAULT_VAR());

class EVENT_CLASS extends API.CORE_EVENTS {
  _onStart(key:PKey){
    if(s.isAtStartSpot(key))
      EVENT.talkNpc(key);
  }
  _getHint(key:PKey){
    if(!s.getVar(key, VAR.talkNpc))
      return "Talk with NPC";
    return `${//TODO add description
    "Solve the puzzle"}`;
  }
  _getQuestMarker(key:PKey){
    if(!s.getVar(key, VAR.gameStarted))
      return s.getStartQuestMarker();
    return null;
  }
  // _getRewardBonus(key:PKey){
  //   return {mult:1 + s.getVar(key,VAR.rightClickCount) * 0.03,description:"Unused Flip-One"};
  // }
  _onDeath(key:PKey){
    if(!s.getVar(key,VAR.gameStarted))
      return;
    s.failQuest(key,"You died. :(");
  }
  talkNpc(key:PKey){
    s.startDialogue(key,DIALOGUE.Ringo_intro);
  }
  startGame(key:PKey){
    s.teleport(key,SPOTS_map1.t1,CST.MAP_INSTANCE.party,false,{createNewMap:true});
    s.setVar(key,VAR.gameStarted,true);

    //? Improve notification?
    s.displayNotification(key,`Use ${s.inputToText(CST.INPUT.interact0, CST.ICON.orbElement)} and ${s.inputToText(CST.INPUT.interact1, CST.ICON.orbElement)} to flip a tile.`);

    // s.setVar(key,VAR.clickCount,0);
    // s.setVar(key,VAR.dateReset,Date.now());
    // s.startChrono(key,LABEL.timer,{visible:false});
    /*
    TODO add speedrun challenge
    if(s.isChallengeActive(key,CHALLENGE.speedrun))
      s.startChrono(key,LABEL.Cspeedrun,{
        countdownFrames:25*40,
        event(key){
          s.message(key,'Speedrun challenge failed.',CST.MSG_COLOR.red);
        },
        icon:CST.ICON.highscoreStar
      });
    */

      /*
      TODO add reset button
    s.setTimeout(key,function(key){
      s.addQuestButton(key, LABEL.resetPuzzle, "Reset",{
        icon:CST.ICON.clockwiseRotation,
        event(key){
          EVENT.resetPuzzle(key);
        }
      });
    },25 * 5,LABEL.timerButtonReset);*/
    
    s.enableAttack(key,false);
  }

  resetPuzzle(key:PKey){
    // if(Date.now() - s.getVar(key,VAR.dateReset) < 1000*10)
      // return s.displayNotification_one(key,"You can only reset after 10 seconds within the puzzle.",true);
    if(s.isAboutToCompleteQuest(key))
      return s.displayNotification_one(key,"You can't reset the puzzle now.",true);
    EVENT.startGame(key);
  }

  /**
   * Function that handles left/right clicks
   * @param key 
   * @param eid 
   * @param reverse should the action be reversed (right click change tiles in reverse)
   */
  click(key:PKey,eid:NKey,reverse?:boolean) {
        // //TODO temp
        // console.log(s.getTagObj(eid));

    // Prevent interaction when the quest is completed
    if (s.isAboutToCompleteQuest(key))
      return;

    // Prevent modifying a locked tile
    if (s.hasTag(eid,{[TAG.locked]: true}))
      return;

    //TODO make sure the quest can't be softlocked and put only necessary security mesures
    // Verify if the player is in the right map (i don't thinks its necessary here because the actor doesn't exist anywhere else)
    if (!s.isInMap(key, MAP.map1))
      return;

    // Get the model from the map
    const mapUid = s.getAttr_mapUid(key)
    if (!mapUid)
      return;
    const model = m.getVarObj<MAP_VAR_1>(mapUid).model;
    if (!model)
      return;



    let x = s.getTag(eid,TAG.tilePosX,null);
    let y = s.getTag(eid,TAG.tilePosY,null);
    if(x === null || y === null)
      return;

    // Flip the tile that has been clicked on
    const newTileType = model.flipTile(x, y, reverse);
    // Update the sprite to reflect the change in the model
    if (newTileType == null)
      s.setSprite_one(eid,EVENT.getTileSprite(0), model.tileScale);
    else
      s.setSprite_one(eid,EVENT.getTileSprite(newTileType), model.tileScale);
  }

  clickLeft(key:PKey,eid:NKey,/*triggerBySolve=false*/){
    EVENT.click(key,eid);
    // s.incrVar(key,VAR.clickCount,1);
  }
  clickRight(key:PKey,eid:NKey){
    EVENT.click(key,eid,true);
    // s.incrVar(key,VAR.clickCount,1);
    // s.incrVar(key,VAR.rightClickCount,-1);
  }
  /**
   * Get the sprite corresponding with the value of the cell.
   * @param type Type of the cell
   */
  getTileSprite(type:number){
    switch (type) {
      case 0: return CSTF.ICON_TO_SPRITE(CST.ICON.numberEmpty);
      case 1: return CSTF.ICON_TO_SPRITE(CST.ICON.colorYellow);
      case 2: return CSTF.ICON_TO_SPRITE(CST.ICON.squareBlue);
      default: {
        Tk.logError('invalid tile type',type);
        return CST.SPRITE.invisible;
      }
    }
  }
  createTile(mapUid:MapUid,spot:SpotQuest,x:number,y:number,model?:PuzzleModel) {
    if (!model) {
      model = m.getVarObj<MAP_VAR_1>(mapUid).model;
      if (!model)
        return;
    }

    let type = model.getCell(x, y);
    let locked = false;
    if (type != 0)
      locked = true;

    m.spawnNpc(mapUid,spot,NPC.tile,{
      vx:x * model.tileSize + model.tileSize/2,
      vy:y * model.tileSize + model.tileSize/2,
      tag:{
        // [TAG.tileType]:grid[i][j],
        [TAG.tilePosX]:x,
        [TAG.tilePosY]:y,
        [TAG.tilePos]:x + '-' + y,
        //TODO test
        ...(locked && { [TAG.locked]:true })
      },
      
      spriteBase:n.newNpc_spriteBase(EVENT.getTileSprite(type), model.tileScale),
      interactionMaxRange:s.RANGE.infinite,
      //TODO better icons
      onInteract0:n.newNpc_onInteract('Flip',EVENT.clickLeft,CST.ICON.clockwiseRotation),
      onInteract1:n.newNpc_onInteract('Force',EVENT.clickRight, CST.ICON.orbElement) //BAD icon
    });
    //TODO create a new, non interactive entity (can we just create a sprite?) that shows when a tile is locked
    //! I don't think the current way is a good way of doing it, but it kinda works
    if (locked) {
      m.spawnNpc(mapUid,spot,NPC.lock,{
        vx:x * model.tileSize + model.tileSize/2,
        vy:y * model.tileSize + model.tileSize/2,
        spriteBase:n.newNpc_spriteBase(CSTF.ICON_TO_SPRITE(CST.ICON.padlockLocked), model.tileScale / 3),
      });
    }
  }

  submitSolution(key: PKey, eid: NKey) {
    // Prevent interaction when the quest is completed
    if (s.isAboutToCompleteQuest(key))
      return;

    // Get the model from the map
    const mapUid = s.getAttr_mapUid(key)
    if (!mapUid)
      return;
    const model = m.getVarObj<MAP_VAR_1>(mapUid).model;
    if (!model)
      return;

    if (model.verifySolution()) {
      s.completeQuest(key, s.isFirstCompletion(key) ? 25 * 2 : 15);
      s.setSprite_one(eid,CST.SPRITE.toggleGreenOn, 1);
    } else {
      //TODO screen shake + enemies? only 3 tries?
    }
  }

  //TODO temp
  /** Cheat function to test. Could also be used for hints or something */
  doNextMove(key: PKey, eid: NKey) {
    // Prevent interaction when the quest is completed
    if (s.isAboutToCompleteQuest(key))
      return;

    // Get the model from the map
    const mapUid = s.getAttr_mapUid(key)
    if (!mapUid)
      return;
    const model = m.getVarObj<MAP_VAR_1>(mapUid).model;
    if (!model)
      return;

    //TODO remove
    model.solveNextMove();
    EVENT.updatetTiles(eid);
  }

  updatetTiles(eid: NKey) {
    console.log("Updating tiles")
    // Get the model from the map
    const mapUid = s.getAttr_mapUid(eid)
    if (!mapUid)
      return;
    const model = m.getVarObj<MAP_VAR_1>(mapUid).model;
    if (!model)
      return;

    console.log("model found")
    let tiles = s.getNpcs(eid, MAP.map1, TAG.tilePos);
    console.log("Tiles: ", tiles)
    for (let tile of tiles) {
      console.log(s.getTagObj(tile));
      let xPos = s.getTag(tile, TAG.tilePosX, null);
      let yPos = s.getTag(tile, TAG.tilePosY, null);
      console.log(xPos, yPos)
      if (xPos == null || yPos == null) {
        continue;
      }

      let type = model.getCell(xPos, yPos);
      console.log(type)
      if (type == null)
        s.setSprite_one(tile,EVENT.getTileSprite(0), model.tileScale);
      else
        s.setSprite_one(tile,EVENT.getTileSprite(type), model.tileScale);
    }
  }
}
const EVENT = new EVENT_CLASS();


// Beginning dialogue
n.newDialogue("Ringo",CST.FACE.villagerMale0,[
  n.newDialogue_node(DIALOGUE.Ringo_intro,"Help me!",[
    n.newDialogue_option("Okay. :)",null,EVENT.startGame)
  ]),
]);

// Tile actor
n.newNpc(NPC.tile,null,{
  name:"",
  neverMove:true,
  neverCombat:true,
  spriteBase:n.newNpc_spriteBase(CSTF.ICON_TO_SPRITE(CST.ICON.numberEmpty), 1),
  hideOptionList:true
});

//TODO maybe this isn't the best way of doing it
// Actor that is only there to show a locked icon on the tiles that can't be changed
n.newNpc(NPC.lock,null,{
  name:"",
  neverMove:true,
  neverCombat:true,
  spriteBase:n.newNpc_spriteBase(CSTF.ICON_TO_SPRITE(CST.ICON.padlockLocked), 0.5),
  hideOptionList:true
});

// Switch to submit the solution
//TODO maybe there is more we should add here
n.newNpc(NPC.submit,null,{
  name:"Submit solution",
  neverMove:true,
  neverCombat:true,
  spriteBase:n.newNpc_spriteBase(CST.SPRITE.toggleGreenOff, 1),
  // block: Actor_Block,
});

//TODO temp
// Switch to test the solver. Solves the puzzle 1 step at a time.
n.newNpc(NPC.doStep,null,{
  name:"Do step",
  neverMove:true,
  neverCombat:true,
  spriteBase:n.newNpc_spriteBase(CST.SPRITE.toggleGreenOff, 1),
  // block: Actor_Block,
});


type MAP_VAR_1 = {model?: PuzzleModel}
const SPOTS_map1 = {a:S,e1:S,q1:S,q2:S,t1:S,t2:S};
n.newMap(MAP.map1,{
  name:'Puzzle room',
  preventPet:() => true
},{
  variables: {},
  spots:SPOTS_map1,
  onLoad(mapUid,spots:typeof SPOTS_map1){
    let key = m.getRandomPlayer(mapUid);
    if(!key)
      return;

    // adds a switch to check if the puzzle is completed
    m.spawnNpc(mapUid,SPOTS_map1.q1,NPC.submit,{
      onInteract0:n.newNpc_onInteract('Submit solution',EVENT.submitSolution,CST.ICON.interact),
    });

    //TODO temp Switch to test the solver.
    m.spawnNpc(mapUid,SPOTS_map1.q2,NPC.doStep,{
      onInteract0:n.newNpc_onInteract('Solve step',EVENT.doNextMove,CST.ICON.interact),
    });

    /** Nb of terrain tiles that constitute the play area */
    let playAreaSizeTiles = 10;

    // Create a new model and saves it in the map's variables
    let model = new PuzzleModel(8,{playAreaSize: playAreaSizeTiles * 32});
    m.getVarObj<MAP_VAR_1>(mapUid).model = model;

    for(let y = 0 ; y < model.height ; y++){
      for(let x = 0 ; x < model.width ; x++){
        EVENT.createTile(mapUid,spots.a,x,y,model)
      }
    }
  },
});

const SPOTS_QfirstTown_main = {n1:S};
n.newMapAddon(MAP.QfirstTown_main,{
  spots:SPOTS_QfirstTown_main,
  onLoad:function(mapUid,spots:typeof SPOTS_QfirstTown_main){
    m.setAsStartPoint(mapUid, spots.n1);
    m.spawnNpc(mapUid,spots.n1,NPC.npc,attrs => {
      attrs.spriteBase = n.newNpc_villagerSprite(CST.SPRITE.hair1, CST.SPRITE.playerBodyBone1);
      //TODO change name
      attrs.name = "Qtest1";
      attrs.onDialogue = EVENT.talkNpc;
    });
  },
});

API.finalize(EVENT);