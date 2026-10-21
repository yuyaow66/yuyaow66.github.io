(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[931],{148:function(n,e,o){Promise.resolve().then(o.bind(o,6005)),Promise.resolve().then(o.t.bind(o,345,23)),Promise.resolve().then(o.bind(o,6954))},6954:function(n,e,o){"use strict";o.r(e),o.d(e,{default:function(){return h}});var t=o(7437),r=o(5887),i=o(2265),a=o(6613),s=o(526),d=o(877),THREE=o(6375);function Lettering(){
  const {viewport,camera,invalidate}= (0,d.A)();
  const [layout,setLayout]=(0,i.useState)(()=>window.chairsHomeLettering||null);
  const texture=(0,i.useMemo)(()=>{
    if(!layout)return null;
    const map=new THREE.CanvasTexture(layout.canvas);
    map.colorSpace=THREE.SRGBColorSpace;
    map.minFilter=THREE.LinearFilter;
    map.magFilter=THREE.LinearFilter;
    map.generateMipmaps=false;
    return map;
  },[layout&&layout.canvas,layout&&layout.width,layout&&layout.height]);
  (0,i.useEffect)(()=>{
    const update=event=>setLayout({...event.detail});
    const close=()=>setLayout(null);
    window.addEventListener("chairs:lettering",update);
    window.addEventListener("chairs:close",close);
    if(window.chairsHomeLettering)setLayout({...window.chairsHomeLettering});
    return()=>{
      window.removeEventListener("chairs:lettering",update);
      window.removeEventListener("chairs:close",close);
      document.body.classList.remove("chairs-home-scene-ready");
    };
  },[]);
  (0,i.useLayoutEffect)(()=>{
    if(texture)texture.needsUpdate=true;
    else document.body.classList.remove("chairs-home-scene-ready");
    invalidate();
  },[texture,layout,invalidate]);
  (0,i.useEffect)(()=>()=>{if(texture)texture.dispose();},[texture]);
  if(!texture||!layout)return null;
  const depth=-Math.max(3,viewport.width/15*4);
  const frame=viewport.getCurrentViewport(camera,[0,0,depth]);
  return (0,t.jsxs)("mesh",{
    position:[0,0,depth],
    scale:[frame.width,frame.height,1],
    raycast:()=>null,
    onAfterRender:()=>{if(!document.documentElement.classList.contains("chairs-chair-hidden")&&!document.body.classList.contains("chairs-home-scene-ready"))document.body.classList.add("chairs-home-scene-ready");},
    children:[
      (0,t.jsx)("planeGeometry",{args:[1,1]}),
      (0,t.jsx)("meshBasicMaterial",{map:texture,transparent:true,depthWrite:false,toneMapped:false})
    ]
  });
}
function l(){let{nodes:n}=(0,a.L)("".concat("/projects/abandoned-chairs","/medias/glass_chair.glb")),{viewport:e,setFrameloop:f,invalidate:g}=(0,d.A)(),o=(0,i.useRef)(null),hovered=(0,i.useRef)(!1),[chairOpen,setChairOpen]=(0,i.useState)(()=>!document.documentElement.classList.contains("chairs-chair-hidden"));return(0,i.useEffect)(()=>{const close=()=>{hovered.current=!1;setChairOpen(!1)};if(document.documentElement.classList.contains("chairs-chair-hidden"))close();window.addEventListener("chairs:close",close);return()=>window.removeEventListener("chairs:close",close)},[]),(0,i.useEffect)(()=>{const sync=()=>{if(document.hidden)hovered.current=!1;f(document.hidden||!chairOpen?"demand":"always"),g()};sync();document.addEventListener("visibilitychange",sync);return()=>document.removeEventListener("visibilitychange",sync)},[chairOpen,f,g]),(0,d.C)(()=>{if(!o.current)return;const t=hovered.current?.25:1;o.current.rotation.x+=.02*t,o.current.rotation.y+=.008*t,o.current.rotation.z+=.005*t}),(0,t.jsx)("group",{scale:e.width/15,children:chairOpen?(0,t.jsx)("mesh",{ref:o,geometry:n.Cube009_Glass001_0.geometry,scale:1,position:[0,0,0],rotation:[0,0,0],onPointerOver:()=>{hovered.current=!0},onPointerOut:()=>{hovered.current=!1},castShadow:!0,receiveShadow:!0,children:(0,t.jsx)(s.z,{thickness:2,roughness:0,transmission:1,ior:1.2,chromaticAberration:.03,backside:!0,samples:10,resolution:1024,backsideResolution:512})}):null})}o(597);var u=o(4788);function h(){return(0,t.jsxs)(r.Xz,{dpr:[1,2],style:{background:"transparent"},children:[(0,t.jsx)(Lettering,{}),(0,t.jsx)(l,{}),(0,t.jsx)("directionalLight",{intensity:2,position:[0,2,3]}),(0,t.jsx)(u.qA,{files:"".concat("/projects/abandoned-chairs","/medias/qwantani_moon_noon_puresky_4k.hdr"),background:!0})]})}},345:function(n){n.exports={main:"page_main__GlU4n"}}},function(n){n.O(0,[689,562,971,938,744],function(){return n(n.s=148)}),_N_E=n.O()}]);