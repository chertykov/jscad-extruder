/* -*- mode: js; electric-indent-mode: 1; indent-tabs-mode: nil -*-
 Copyright (C) 2015 Denis Chertykov

 This program is free software; you can redistribute it and/or modify
 it under the terms of the GNU General Public License as published by
 the Free Software Foundation; either version 3, or (at your option)
 any later version.
*/

var global;
var gear;
var lever;
var shaft;
var base;
var bearing;


// Different constant dimentions.
var Size = {
    m3: {
        wall: 3,                 // plastic wall for m3 screw support
        r: 3.4 / 2.0,            // M3 screw hole radius
        screw_r: 3.2 / 2.0,      // Screw without nut. Tight. Self tap.
        washer_h: 0.5,           // really it 0.5
        washer_r_o: 7 / 2,
        nut_r: 6.7 / 2,
        nut_h: 2.5,
        head_r: 5.7 / 2,         // real 5.4
        head_h: 3
    },
    m4: {
        wall: 3,                 // plastic wall for m3 screw support
        r: 4.4 / 2.0,            // M3 screw hole radius
        screw_r: 4.0 / 2.0,      // Screw without nut. Tight. Self tap.
        washer_h: 0.8,           //
        washer_r_o: 9.4 / 2,
        head_r: 7.3 / 2,         // real 5.4
        head_h: 4
    }        
};

var mk8_gear = {
    h: 11.0,
    id: 5.0,                    // inner diameter (bore)
    od: 9.0,                    // outer diameter
    hob_d: 7.3,
    hob_h: 8.0,
    set_screw_d: 3.0,
    set_screw_h: 3.0,
    set_screw_pos: 3.0          // Height of set screw hole.
};

var mk7_gear = {
    h: 12.0,
    id: 5.0,
    od: 12.5,
    hob_d: 10.5,
    hob_h: 8.0,
    set_screw_d: 3.0,
    set_screw_h: 3.0,
    set_screw_pos: 3.0          // Height of set screw hole.
};

var custom_gear = {
    h: 12.0,
    id: 5.0,
    od: 0,                      // Calculated in main.
    hob_d: 0,                   // Likewise.
    hob_h: 8.0,
    set_screw_d: 3.0,
    set_screw_h: 3.0,
    set_screw_pos: 3.0          // Height of set screw hole.
};

var spring = {
    od: 6.0,                    // Outer diametr
    id: 4.2,                    // Inner diametr
    l: 15.0,                    // Length
    work_l: 11                  // Compressed length. Working length.
};


function getParameterDefinitions()
{
    return [
        { name: '_version', caption: 'Version', type: 'text', initial: "0.2 9-Mar-2015" },
        {
            name: 'debug',
            caption: 'Look inside (debug): ',
            type: 'choice',
            initial: "no",
            values: ["no", "yes"],
            captions: ["no", "yes"]
        },
        {
            name: 'render',
            caption: 'What to show: ',
            type: 'choice',
            initial: "assembly",
            values: ["report",
                     "assembly",
                     "assembly no motor",
                     "plate",
                     "--test1--",
                     "lever",
                     "base",
                     "shaft"],
            captions: ["Report (BOM)",
                       "Extruder assembly",
                       "Assembly, no motor",
                       "Parts plate",
                       "-----",
                       "Lever",
                       "Base",
                       "Shaft"
                      ]
        },
        {
            name: 'fn',
            type: 'int',
            caption: 'Output resolution (16, 24, ...): ',
            initial: 8
        },
        {
            name: 'bearing_type', 
            type: 'choice',
            caption: 'Idler bearing: ',
            values: ["623", "624"],
            captions: ["623 (3x10x4)", "624 (4x13x5)"], 
            initial: "623"
        },
        {
            name: 'drive_gear', 
            type: 'choice',
            caption: 'Drive gear: ',
            values: ["mk8", "mk7", "custom"],
            captions: ["Mk8", "Mk7", "Custom"], 
            initial: "mk8"
        },
        {
            name: 'custom_hob_d',
            type: 'float',
            caption: 'Custom hob diameter ("Drive gear" = Custom): ',
            initial: 7
        },
        {
            name: 'filament_offset',
            type: 'float',
            caption: 'Filament offset from motor surface: ',
            initial: 15
        },
        {
            name: 'filament_d',
            type: 'float',
            caption: 'Filament diameter: ',
            initial: 1.75
        },
        {
            name: 'spring_length',
            type: 'float',
            caption: 'Spring compressed length: ',
            initial: 11
        },
        {
            name: 'spring_od',
            type: 'float',
            caption: 'Spring diameter: ',
            initial: 6
        },
        {
            name: 'axial_clr',
            type: 'float',
            caption: 'Axial clearance (shaft-lever): ',
            initial: 0.2
        },
        {
            name: 'radial_clr',
            type: 'float',
            caption: 'Radial clearance (shaft-lever): ',
            initial: 0.15
        }
    ]; 
}

// Bearing model.
function Bearing(id, od, h)
{
    this.id = id;
    this.od = od;
    this.h = h;
    if (id == 3)
        this.screw = Size.m3;
    else if (id == 4)
        this.screw = Size.m4;

    this.draw = function ()
    {
        return difference (cylinder ({d: this.od, h: this.h, center: true}),
                           cylinder ({d: this.id, h: this.h + 1, center: true}));
    };
}


// Drive gear. Hobbed gear.
function drive_gear ()
{
    res = difference (cylinder ({d: gear.od, h: gear.h, fn: global.fn}),
                      cylinder ({d: gear.id, h: gear.h + 2, fn: global.fn}).translate ([0, 0, -1]));
    // Sphere - knife
    var sphere_r = 2;
    s = sphere ({r: sphere_r, fn: 10})
        .translate([0, gear.hob_d / 2.0 + sphere_r, gear.hob_h]);
    for (var a = 0; a < 360; a += 10)
        res = difference (res, s.rotateZ (a));
    return res.setColor (0.5, 0.5, 0.5);
}


// Nema 17 x 39 parameters.
var nema17_39 = {
    motorBody_len: 39.0,    // Motor length
    side_size: 42.2,  // Motor width
    motorBody_chamfer: 5.0, // Motor chamfer
    
    motorCap_len: 8.0,      // Motor cap length
    motorCap_thickness: 0.0,    // Motor cap thickness
    motorCap_chamfer: 2.5,   // Motor cap chamfer

    shaft_len: 22.0,        // Shaft length
    shaft_radius: 2.5,      // Shaft radius

    motor_ring_r: 11.0, // Ring radius
    motor_ring_h: 2.0,  // Ring height

    mount_dist: 31.04 / 2, // Mounting hole offset
    mountingholes_radius: 1.5,    // Mounting hole radius
    mountingholes_depth: 4.5      // Mounting hole depth
};

var nema = nema17_39;


function main (params)
{
    var res;

    global = params;

    spring.work_l = params.spring_length;
    spring.od = params.spring_od;

    switch (params.drive_gear) {
    case "mk8":
        gear = mk8_gear;
        break;
        
    case "mk7":
        gear = mk7_gear;
        break;

    case "custom":
        gear = custom_gear;
        gear.hob_d = params.custom_hob_d;
        gear.od = gear.hob_d + 2;
        break;
    }

    if (global.bearing_type == "623")
        bearing = new Bearing(3, 10, 4); // 623
    else if (global.bearing_type == "624")
        bearing = new Bearing(4, 13, 5); // 624

    lever = new Lever ();
    shaft = new Shaft (lever.h + global.axial_clr);
    base = new Base (params.filament_offset);
    res = [];
    switch (params.render){
    case '--test--':
        res = [stepper(nema),
               drive_gear().translate([0, 0, params.filament_offset - gear.hob_h])];
        break;

    case 'report':
        var shaft_m3_len = base.shaft_base_h + shaft.h - Size.m3.head_h;
        // Text report.
        res.push (text3d ("Shaft screw length: "+ shaft_m3_len + " + 4mm mount hole depth => "
                          + (shaft_m3_len + 4))
                  .translate ([0, 10, 0]));
        res.push (text3d ("Idler screw length: 8mm")
                  .translate ([0, 5, 0]));
        res.push (text3d ("Mount screw length: 6mm")
                  .translate ([0, 0, 0]));
        res.push (text3d ("Spring D: " + spring.od + "mm, compressed length: " + spring.work_l + "mm")
                  .translate ([0, -5, 0]));
        break;

    case "assembly":
        res.push (stepper (nema));
        // fallthrough
    case "assembly no motor":
        var g = drive_gear().translate([0, 0, params.filament_offset - gear.hob_h]);
        res.push (shaft.draw ().setColor (0.7, 0.8, 0.7)
                  .mirroredZ ()
                  .translate ([-nema.mount_dist, nema.mount_dist, base.shaft_base_h + shaft.h]));
        res.push (g);
        res.push (base.draw ().setColor (0.7, 0.75, 0.85));
        res.push (lever.draw ().translate ([0, 0, base.shaft_base_h]).setColor (0.6, 0.7, 0.8));
        res.push (cylinder ({d: global.filament_d, h: 80, center: true})
                  .setColor (0.7, 0.6, 0, 0.7)
                  .rotateX (90)
                  .translate ([-(gear.hob_d + global.filament_d) / 2, 0, global.filament_offset]));
        res.push (bearing.draw ()
                  .translate ([-lever.bearing_x_offset, 0, global.filament_offset])
                  .setColor (0.6, 0.6, 0.6, 0.7));
        break;

    case "plate":
        res = [lever.draw (),
               shaft.draw ().translate ([nema.mount_dist / 3, 0, 0]),
               base.draw ().translate ([0, -nema.mount_dist * 2, 0])] ;
            break;
        
    case "shaft":
        res = shaft.draw ();
        break;

    case "base":
        res = base.draw ();
        break;
        
    case "lever":
        res = lever.draw ();
        break;
        
    default:
        break;
    }
    return res;
}

function Shaft(height)
{
    this.od = 8;                // Diameter of lever shaft.
    this.head_od = this.od + 2;
    this.head_h = Size.m3.head_h + 1;
    this.h = height;

    this.draw = function()
    {
        // head
        var head = cylinder ({d: this.head_od, h: this.head_h, fn: global.fn});
        var shaft = head.union (cylinder ({d: this.od, h: this.h, fn: global.fn}));
        // hole
        var hole = cylinder ({r: Size.m3.r, h: this.h + 1, fn: 8});
        // m3 head hole
        var head_hole = (cylinder ({r: Size.m3.head_r, h: Size.m3.head_h + 1, fn: global.fn})
                     .translate ([0, 0, -1]));
        var support = (cylinder ({d: this.head_od, h: 0.2, fn: global.fn})
                   .translate ([0, 0, this.head_h - 1]));
        shaft = shaft.union (head).subtract ([hole, head_hole]);

        shaft = shaft.union (support);

        // Look inside
        if (global.debug == "yes")
            shaft = shaft.subtract (cube ([30,30,30]).rotateZ(90));
        
        return shaft;
    };
}


function Lever ()
{
    this.h = bearing.h + 1.0 + 3 * 2;
    this.clr = global.radial_clr; // Diameter clearance
    this.grip_extra_l = 15.0;
    this.finger_d = 20.0;
    var fake_shaft = new Shaft (10);
    this.shaft_hole_d = fake_shaft.head_od + 2 + 2 * this.clr;
    this.bearing_hous_d = bearing.od + 4;
    this.spring_offset_x = nema.mount_dist;
    this.spring_offset_y = nema.mount_dist - this.shaft_hole_d / 2.0 + 2;
    this.bearing_x_offset = gear.hob_d / 2 + bearing.od / 2 + global.filament_d;

    this.draw = function ()
    {
        // Bearing housing.
        var bearing_offset = this.bearing_x_offset;
        var bearing_hous = circle ({r: this.bearing_hous_d / 2, center: true, fn: global.fn});
        bearing_hous = (union (bearing_hous,
                               square (this.bearing_hous_d)
                               .translate ([0, -this.bearing_hous_d / 2, 0]))
                        .translate ([-bearing_offset, 0, 0]));
        
        
        // Shaft housing
        var shaft_hole = (circle ({r: this.shaft_hole_d / 2, center: true, fn: global.fn})
                          .translate ([-nema.mount_dist, nema.mount_dist, 0]));
        var left_part = hull (shaft_hole, bearing_hous);
        var res = left_part;

        // Arm
        var arm_c = circle ({r: this.shaft_hole_d / 4, center:true, fn: global.fn});
        var arm = union (arm_c, arm_c.translate ([0, 1, 0]));
        arm = arm.translate ([nema.mount_dist + this.grip_extra_l,
                              nema.mount_dist - this.shaft_hole_d / 4.0,
                              0]);
        // Cut off finger place
        var fp = (circle ({r: this.finger_d / 2, center:true, fn: global.fn})
                  .translate ([nema.mount_dist + this.grip_extra_l / 3 * 2.0,
                               nema.mount_dist + this.finger_d / 2,
                               -0.5]));
        arm = hull (shaft_hole, arm).subtract (fp).union (arm);
        res = linear_extrude ({height: this.h}, union (res, arm));

        // Shaft hole.
        // head
        res = res.subtract (cylinder ({d: shaft.head_od + this.clr,
                                       h: shaft.head_h + 1,
                                       fn: global.fn})
                            .translate ([-nema.mount_dist, nema.mount_dist, this.h - shaft.head_h]));
        // No bevel on shaft, so make it here. ;)
        res = res.subtract (cylinder ({d1: shaft.head_od + this.clr * 3,
                                       d2: shaft.head_od + this.clr,
                                       h: this.clr * 2,
                                       fn: global.fn})
                            .translate ([-nema.mount_dist, nema.mount_dist, this.h - shaft.head_h]));
        // shaft
        res = res.subtract (cylinder ({d: shaft.od + this.clr,
                                       h: this.h + 2,
                                       fn: global.fn})
                            .translate ([-nema.mount_dist, nema.mount_dist, 0]));

        // Idler bearing housing.
        var bh_h = bearing.h + bearing.screw.washer_h * 2;
        var ibh = union (cylinder ({d: bearing.od + 2, h: bh_h}),
                         cube ({size: [bearing.od, bearing.od + 2, bh_h]})
                         .translate ([0, -(bearing.od + 2) / 2.0, 0]));
        // Plastic "washer".
        ibh = ibh.subtract (cylinder ({d: bearing.id + 4, h: Size.m3.washer_h}));
        //
        ibh = ibh.translate ([-bearing_offset, 0, this.h / 2 - bh_h / 2.0]);
        res = res.subtract (ibh);
        // 
        res = res.subtract (cube ({size: [bearing_offset * 2 - bearing.od + 2,
                                          nema.mount_dist * 2 - this.shaft_hole_d,
                                          this.h * 3],
                                   center: true}));
        
        // arm-bearing buttress
        var buttress_r = bearing.od / 2 + 1;
        var buttress = cylinder ({r: buttress_r, h: this.h, fn: global.fn});
        buttress = buttress.subtract (cube ({size: [buttress_r * 2 + 1, buttress_r * 2 + 1, this.h + 2],
                                             center: [1, 0, 0]})
                                      .rotateZ (45 + 20));
        buttress = buttress.subtract (cube ({size: [buttress_r * 2 + 1, buttress_r * 2 + 1, this.h + 2],
                                             center: [1, 0, 0]})
                                      .rotateZ (45 - 20));
        buttress = buttress.translate ([-bearing_offset + bearing.od / 2 - 1,
                                        buttress_r * 2,
                                        0]);

        res = res.union (buttress);
        
        res = res.union (cylinder ({r: bearing.screw.r + 0.6, h: (bh_h + this.h) / 2})
                         .translate ([-bearing_offset, 0, 0]));
        // Idler bearing screw-shaft hole
        var ss_hole = union (cylinder ({r: bearing.screw.screw_r, h: this.h * 3, center: true, fn: 8}),
                             cylinder ({r: bearing.screw.head_r + this.clr, h: this.h, fn: global.fn})
                             .translate ([0, 0, this.h - 2])
                            ).translate ([-bearing_offset, 0, 0]);
        
        res = difference (res, ss_hole);

        // Spring housing
        var spr_d = spring.od + 0.6;
        res = res.subtract (cylinder ({d: spr_d, h: spring.work_l})
                            .rotateX (90)
                            .translate ([this.spring_offset_x, this.spring_offset_y, this.h / 2.0]));
        // Filament path
        var filament_path_d = global.filament_d + 1;
        var filament_x_offset = global.filament_d / 2.0 + gear.hob_d / 2.0;

        var fil = square ({size: [filament_path_d, 50], center: [1,0]});
        fil = linear_extrude ({height: filament_path_d},
                              hull (fil, fil.rotateZ (7)));

        res = res.subtract (fil.translate ([-filament_x_offset - global.filament_d / 2,
                                            0,
                                            this.h / 2 - filament_path_d / 2]));

        // Look inside
        if (global.debug == "yes")
        {
            res = res.subtract (cube ([30,30,30])
                                .rotateZ(90)
                                .translate ([-nema.mount_dist, nema.mount_dist, 0]));
            res = res.subtract (cube ([30,30,30])
                                .rotateZ (180)
                                .translate ([-bearing_offset, 0, 0]));
        }

        return res;
        
    };
}

// Extruder base plate.
// hob_h - distance from filament to motor base.
function Base(hob_h)
{
    this.base_h = 4.2;           // Base plate thickness.
    this.support_wall = 2.0;
    
    this.round_d = nema.side_size - nema.mount_dist * 2;
    this.shaft_base_h = hob_h - lever.h / 2.0;
    this.spring_z = hob_h;
    this.spring_x = lever.spring_offset_x;
    this.spring_y = lever.spring_offset_y;
    
    this.draw = function ()
    {
        // Around left motor mount hole
        var left = (circle ({r: lever.shaft_hole_d / 2, center: true, fn: global.fn})
                    .translate ([-nema.mount_dist, nema.mount_dist, 0]));
        // Around right motor mount hole
        var right = (circle ({r: this.round_d / 2, center: true, fn: global.fn})
                     .translate ([nema.mount_dist, nema.mount_dist, 0]));
        // base plate.
        var plate = linear_extrude ({height: this.base_h}, hull (left, right));

        // Shaft support.
        var shaft_support = (cylinder ({d: lever.shaft_hole_d, h: this.shaft_base_h, fn: global.fn})
                             .translate ([-nema.mount_dist, nema.mount_dist, 0]));

        // Spring support plate.
        var base_min_y = nema.mount_dist - 9;
        var spring_plate = (cube ([nema.side_size / 2.0, nema.mount_dist + base_min_y, this.base_h])
                            .translate ([0, -base_min_y, 0]));
        // 
        var res = union (plate, shaft_support, spring_plate);

        // Cut off motor ring.
        res = res.subtract (cylinder ({r: nema.motor_ring_r + 1,
                                       h: this.base_h * 3,
                                       center: true,
                                       fn: global.fn}));

        // Spring support (ss_).
        var ss_x = this.support_wall * 2 + spring.od + 1;
        var ss_y = nema.mount_dist - lever.shaft_hole_d / 2.0;
        ss_z = this.shaft_base_h + lever.h;
        ss_base = (cube ([ss_x, ss_y, this.shaft_base_h + lever.h / 2])
                   .translate ([this.spring_x - ss_x / 2.0, -base_min_y, 0]));
        ss_head = (cylinder ({d: ss_x, h: ss_y, fn: global.fn})
                   .rotateX (-90)
                   .translate ([this.spring_x, -base_min_y, this.shaft_base_h + lever.h / 2]));

        ss_plate = (cube ([ss_x, nema.mount_dist, this.base_h])
                   .translate ([this.spring_x - ss_x / 2.0, -base_min_y, 0]));
        
        // Right lever guide. For minimizing lever twist.
        var r_guide = (cube ([2, nema.side_size / 2, this.shaft_base_h])
                       .translate ([this.spring_x - ss_x / 2.0, 0, 0]));


        res = union (res, ss_base, ss_head, ss_plate, r_guide);
        
        // Spring housing.
        var spr_d = spring.od + 0.6;
        var spr_hous = (cylinder ({d: spr_d, h: spring.work_l, fn: global.fn})
                        .rotateX (90)
                        .translate ([this.spring_x, this.spring_y, this.spring_z]));
        res = res.subtract (spr_hous);
        // Mount holes
        var hole = cylinder ({r: Size.m3.r, h: this.shaft_base_h + 2, fn: global.fn});
        res = difference (res,
                          hole.translate ([nema.mount_dist, nema.mount_dist, -1]),
                          hole.translate ([-nema.mount_dist, nema.mount_dist, -1]));
        // Screw head housings.
        var head_house = (cylinder ({r: Size.m3.head_r, h: this.shaft_base_h, fn: global.fn})
                          .translate ([0, nema.mount_dist, this.base_h - Size.m3.head_h]));
        res = res.subtract (head_house.translate ([nema.mount_dist, 0, 0]));

        // Cut off motor ring.
        res = res.subtract (cylinder ({r: nema.motor_ring_r + 1,
                                       h: nema.motor_ring_h + global.axial_clr,
                                       fn: global.fn}));

        // Look inside
        if (global.debug == "yes")
        {
            res = res.subtract (cube ([30,30,30])
                                .rotateZ(90)
                                .translate ([-nema.mount_dist, nema.mount_dist, 0]));
            res = res.subtract (cube ([30,30,30])
                                .translate ([nema.mount_dist, nema.mount_dist, 0]));
            res = res.subtract (cube ([30,30,30])
                                .translate ([nema.mount_dist,
                                             -base_min_y,
                                             this.shaft_base_h + lever.h / 2]));
        }
   
        return res;
    };
}


// Nema 17 stepper motor.
function stepper (parameters)
{
    var length = parameters.motorBody_len / 2;
    var width = parameters.side_size / 2;
    var z = width;
    var ch = sqrt (2.0) * width - sqrt (0.5) * parameters.motorBody_chamfer;
    var ch2 = sqrt (2.0) * width - sqrt (0.5) * parameters.motorCap_chamfer;
    var depth = parameters.mountingholes_depth;
    var offset = parameters.mount_dist;

    var cube = new CSG.roundedCube
    ({
        center: [0, 0, 0],
        radius: [length - parameters.motorCap_len, width - parameters.motorCap_thickness, width - parameters.motorCap_thickness],
        roundradius: 0.2,
        resolution: 16
    });
    cube = cube.setColor (0.67843137254901960784313725490196, 0.70588235294117647058823529411765, 0.70588235294117647058823529411765);
    var xcube = new CSG.cube
    ({
        center: [0, 0, 0],
        radius: [length, ch, ch]
    });
    xcube = xcube.setColor (0.67843137254901960784313725490196, 0.70588235294117647058823529411765, 0.70588235294117647058823529411765);
    cube = cube.intersect (xcube.rotateX(45));

    var cube2 = new CSG.roundedCube
    ({
        center: [length - (parameters.motorCap_len / 2.0), 0, 0],
        radius: [(parameters.motorCap_len / 2.0), width, width],
        roundradius: 0.2,
        resolution: 16
    });
    cube2 = cube2.setColor (0.87058823529411764705882352941176, 0.89803921568627450980392156862745, 0.90588235294117647058823529411765);
    var cube3 = cube2.translate([-(parameters.motorBody_len - parameters.motorCap_len), 0, 0]);
    xcube = new CSG.cube
    ({
        center: [0, 0, 0],
        radius: [length, ch2, ch2]
    });
    xcube = xcube.setColor (0.87058823529411764705882352941176, 0.89803921568627450980392156862745, 0.90588235294117647058823529411765);
    xcube = xcube.rotateX(45);
    cube2 = cube2.intersect (xcube);
    cube3 = cube3.intersect (xcube);

    var ring = new CSG.cylinder
    ({
        start: [length, 0, 0],
        end: [length + parameters.motor_ring_h, 0, 0],
        radius: parameters.motor_ring_r,
        resolution: global.fn
    });
    ring = ring.setColor (0.81176470588235294117647058823529, 0.84313725490196078431372549019608, 0.85098039215686274509803921568627);

    var shaft = new CSG.cylinder
    ({
        start: [length + parameters.motor_ring_h, 0, 0],
        end: [length + parameters.motor_ring_h + parameters.shaft_len, 0, 0],
        radius: parameters.shaft_radius,
        resolution: global.fn
    });
    shaft = shaft.setColor (0.9, 0.91, 0.91);
    var motor = cube.union ([cube2, cube3,ring, shaft]);  

    var mountinghole = new CSG.cylinder
    ({
        start: [-depth, 0, 0],
        end: [0, 0, 0],
        radius: parameters.mountingholes_radius,
        resolution: global.fn
    });
    mountinghole = mountinghole.setColor (0.2,0.2,0.2);
    motor = motor.subtract (mountinghole.translate ([length, offset, offset]));
    motor = motor.subtract (mountinghole.translate ([length, offset, -offset]));
    motor = motor.subtract (mountinghole.translate ([length, -offset, offset]));
    motor = motor.subtract (mountinghole.translate ([length, -offset, -offset]));

    return motor.rotateY (-90).translate ([0, 0, -length]);
}


function text3d(what){
    var l = vector_text(0,0,what);   
    var o = [];
    l.forEach(function(pl)
              {                   
                  o.push(rectangular_extrude(pl, {w: 5, h: 2}));   
              });
    return union(o).scale(0.1);
}

