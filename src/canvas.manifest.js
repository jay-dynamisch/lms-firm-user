export const manifest = {
  screens: {
    scr_pan0n3: { name: "Dashboard", route: "/", position: { "x": 160, "y": 220 } },
    scr_5p4nik: { name: "Courses", route: "/courses", position: { "x": 1560, "y": 220 } },
    scr_alr3qy: { name: "Course Detail", route: "/courses/c1", position: { "x": 2960, "y": 220 } },
    scr_qhdgao: { name: "Lesson Player", route: "/courses/c1/lessons/l1", position: { "x": 4360, "y": 220 } },
    scr_c84q6j: { name: "Certificates", route: "/certificates", position: { "x": 1560, "y": 2200 } },
    scr_1l9yo1: { name: "Profile", route: "/profile", position: { "x": 160, "y": 2200 } }
  },
  sections: {
    sec_amlsp7: { name: "Learning Path", x: 0, y: 0, width: 5720, height: 1180 },
    sec_7aeu6f: { name: "User Account", x: 0, y: 1980, width: 2920, height: 1180 }
  },
  layers: [
  { kind: "section", id: "sec_amlsp7", children: [
    { kind: "screen", id: "scr_pan0n3" },
    { kind: "screen", id: "scr_5p4nik" },
    { kind: "screen", id: "scr_alr3qy" },
    { kind: "screen", id: "scr_qhdgao" }]
  },
  { kind: "section", id: "sec_7aeu6f", children: [
    { kind: "screen", id: "scr_1l9yo1" },
    { kind: "screen", id: "scr_c84q6j" }]
  }]

};